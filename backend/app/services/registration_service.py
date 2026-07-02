import asyncio
import uuid
from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import EventStatus, ListStatus, Player, PushSubscription, Registration
from app.services.event_service import _app_url, _send_pushes_bg, get_event


async def list_registrations(session: AsyncSession, event_id: uuid.UUID) -> list[Registration]:
    stmt = (
        select(Registration)
        .where(Registration.event_id == event_id)
        .order_by(Registration.list_status, Registration.position)
    )
    return list((await session.scalars(stmt)).all())


async def _next_position(session: AsyncSession, event_id: uuid.UUID, status_: ListStatus) -> int:
    stmt = select(func.count()).select_from(Registration).where(
        Registration.event_id == event_id,
        Registration.list_status == status_,
    )
    return int(await session.scalar(stmt) or 0) + 1


async def _notify_player(
    session: AsyncSession, player_id: uuid.UUID | None, *, title: str, body: str, url: str
) -> None:
    """Fire-and-forget push to every device of one player. No-op if the player
    has no subscriptions (i.e. hasn't enabled notifications)."""
    if not player_id:
        return
    subs = list(
        (await session.scalars(select(PushSubscription).where(PushSubscription.player_id == player_id))).all()
    )
    if not subs:
        return
    subs_data = [{"endpoint": s.endpoint, "p256dh": s.p256dh, "auth": s.auth} for s in subs]
    asyncio.ensure_future(_send_pushes_bg(subs_data, title=title, body=body, url=url))


async def _confirmed_count(session: AsyncSession, event_id: uuid.UUID) -> int:
    stmt = select(func.count()).select_from(Registration).where(
        Registration.event_id == event_id,
        Registration.list_status == ListStatus.CONFIRMED,
    )
    return int(await session.scalar(stmt) or 0)


async def _matching_player(session: AsyncSession, name: str) -> Player | None:
    # Exact match first
    stmt = select(Player).where(func.lower(Player.name) == name.casefold()).limit(1)
    player = await session.scalar(stmt)
    if player:
        return player
    # Fall back to first-word match (e.g. "Marcin Matysik" -> "Marcin")
    first = name.split()[0].casefold()
    if first != name.casefold():
        stmt = select(Player).where(func.lower(Player.name) == first).limit(1)
        player = await session.scalar(stmt)
    return player


async def register(session: AsyncSession, event_id: uuid.UUID, name: str) -> Registration:
    event = await get_event(session, event_id)
    if event.status == EventStatus.CANCELLED:
        raise HTTPException(status.HTTP_409_CONFLICT, "Cannot register to a cancelled event")
    existing = [item for item in await list_registrations(session, event_id) if item.display_name.casefold() == name.casefold()]
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "This name is already registered")
    confirmed = sum(1 for item in await list_registrations(session, event_id) if item.list_status == ListStatus.CONFIRMED)
    list_status = ListStatus.CONFIRMED if confirmed < event.max_players else ListStatus.WAITLIST
    player = await _matching_player(session, name)
    registration = Registration(
        event_id=event_id,
        player_id=player.id if player else None,
        display_name=name,
        list_status=list_status,
        position=await _next_position(session, event_id, list_status),
    )
    session.add(registration)
    await session.commit()
    await session.refresh(registration)

    # Notify the match creator that a player enrolled. Skip when the creator
    # joins their own match.
    if name.casefold() != event.created_by_name.casefold():
        creator = await _matching_player(session, event.created_by_name)
        if creator:
            if list_status == ListStatus.CONFIRMED:
                body = f"{name} joined your match at {event.venue.name} ({confirmed + 1}/{event.max_players})."
            else:
                body = f"{name} joined the waitlist for your match at {event.venue.name}."
            await _notify_player(
                session, creator.id,
                title="New player enrolled",
                body=body,
                url=f"{_app_url()}/events/{event.id}",
            )
    return registration


async def _resequence(session: AsyncSession, event_id: uuid.UUID) -> None:
    for status_ in (ListStatus.CONFIRMED, ListStatus.WAITLIST):
        items = [item for item in await list_registrations(session, event_id) if item.list_status == status_]
        for index, item in enumerate(items, start=1):
            item.position = index


async def unregister(session: AsyncSession, event_id: uuid.UUID, registration_id: uuid.UUID, name: str) -> None:
    registration = await session.get(Registration, registration_id)
    if not registration or registration.event_id != event_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Registration not found")
    if registration.display_name.casefold() != name.casefold():
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Name does not match registration")
    was_confirmed = registration.list_status == ListStatus.CONFIRMED
    leaver_name = registration.display_name
    await session.delete(registration)
    await session.flush()
    # Capture promoted player details before commit expires the ORM attributes.
    promoted_player_id: uuid.UUID | None = None
    promoted_name: str | None = None
    if was_confirmed:
        waitlist = [item for item in await list_registrations(session, event_id) if item.list_status == ListStatus.WAITLIST]
        if waitlist:
            waitlist[0].list_status = ListStatus.CONFIRMED
            promoted_player_id = waitlist[0].player_id
            promoted_name = waitlist[0].display_name
    await _resequence(session, event_id)
    await session.commit()

    # Notifications (fire-and-forget). Fetch a fresh event for venue + creator.
    event = await get_event(session, event_id)
    when = f"{event.event_date.strftime('%a %d %b')} at {str(event.event_time)[:5]}"
    url = f"{_app_url()}/events/{event.id}"

    # 1. Tell the creator someone left (unless the creator left their own match).
    if leaver_name.casefold() != event.created_by_name.casefold():
        creator = await _matching_player(session, event.created_by_name)
        if creator:
            confirmed_now = await _confirmed_count(session, event_id)
            await _notify_player(
                session, creator.id,
                title="Player dropped out",
                body=f"{leaver_name} left your match at {event.venue.name} ({confirmed_now}/{event.max_players}).",
                url=url,
            )

    # 2. Tell the auto-promoted waitlist player they now have a confirmed spot.
    if promoted_player_id and (promoted_name or "").casefold() != leaver_name.casefold():
        await _notify_player(
            session, promoted_player_id,
            title="You're in!",
            body=f"A spot opened up — you're now confirmed for the match at {event.venue.name} on {when}.",
            url=url,
        )


async def set_payment(session: AsyncSession, registration_id: uuid.UUID, paid: bool) -> Registration:
    registration = await session.get(Registration, registration_id)
    if not registration:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Registration not found")
    registration.has_paid = paid
    registration.paid_at = datetime.now(UTC) if paid else None
    await session.commit()
    await session.refresh(registration)
    return registration


async def update_guest_profile(
    session: AsyncSession,
    event_id: uuid.UUID,
    registration_id: uuid.UUID,
    guest_profile,  # GuestProfile | None — avoid circular import; validated upstream
) -> Registration:
    registration = await session.get(Registration, registration_id)
    if not registration or registration.event_id != event_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Registration not found")
    if registration.player_id is not None:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "This player is already linked to a profile — edit their profile instead.",
        )
    registration.guest_profile = guest_profile.model_dump(exclude_none=True) if guest_profile else None
    await session.commit()
    await session.refresh(registration)
    return registration

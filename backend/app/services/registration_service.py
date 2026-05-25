import uuid
from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import EventStatus, ListStatus, Player, Registration
from app.services.event_service import get_event


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


async def _matching_player(session: AsyncSession, name: str) -> Player | None:
    stmt = select(Player).where(func.lower(Player.name) == name.casefold()).limit(1)
    return await session.scalar(stmt)


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
    await session.delete(registration)
    await session.flush()
    if was_confirmed:
        waitlist = [item for item in await list_registrations(session, event_id) if item.list_status == ListStatus.WAITLIST]
        if waitlist:
            waitlist[0].list_status = ListStatus.CONFIRMED
    await _resequence(session, event_id)
    await session.commit()


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

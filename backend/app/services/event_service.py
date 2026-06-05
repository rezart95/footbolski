import uuid
from datetime import datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy import and_, desc, func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Event, EventStatus, ListStatus, PushSubscription, Registration, Venue
from app.schemas.event import EventCreate
from app.services import notification_service


async def _count(session: AsyncSession, event_id: uuid.UUID, list_status: ListStatus) -> int:
    stmt = select(func.count()).select_from(Registration).where(
        Registration.event_id == event_id,
        Registration.list_status == list_status,
    )
    return int(await session.scalar(stmt) or 0)


def _effective_status(event: Event) -> EventStatus:
    """Return completed if the match (+ 90 min) has already passed, even if DB still says upcoming."""
    if event.status != EventStatus.UPCOMING:
        return event.status
    match_end = datetime.combine(event.event_date, event.event_time) + timedelta(minutes=90)
    if datetime.now() > match_end:
        return EventStatus.COMPLETED
    return EventStatus.UPCOMING


async def as_read(session: AsyncSession, event: Event) -> dict:
    return {
        "id": event.id,
        "venue": event.venue,
        "event_date": event.event_date,
        "event_time": event.event_time,
        "max_players": event.max_players,
        "created_by_name": event.created_by_name,
        "status": _effective_status(event),
        "teams_generated": event.teams_generated,
        "confirmed_count": await _count(session, event.id, ListStatus.CONFIRMED),
        "waitlist_count": await _count(session, event.id, ListStatus.WAITLIST),
        "ai_reasoning": event.ai_reasoning,
        "ai_swap_options": event.ai_swap_options,
    }


async def list_events(
    session: AsyncSession,
    status_filter: EventStatus | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[dict]:
    stmt = (
        select(Event)
        .options(selectinload(Event.venue))
        .order_by(desc(Event.event_date), desc(Event.event_time))
    )
    if status_filter:
        stmt = stmt.where(Event.status == status_filter)
    stmt = stmt.limit(limit).offset(offset)
    events = (await session.scalars(stmt)).all()
    return [await as_read(session, event) for event in events]


async def upcoming_event(session: AsyncSession) -> dict | None:
    # Exclude events whose match + 90 min has already passed (server may be in UTC)
    cutoff = datetime.now() - timedelta(minutes=90)
    stmt = (
        select(Event)
        .options(selectinload(Event.venue))
        .where(
            Event.status == EventStatus.UPCOMING,
            or_(
                Event.event_date > cutoff.date(),
                and_(Event.event_date == cutoff.date(), Event.event_time > cutoff.time()),
            ),
        )
        .order_by(Event.event_date, Event.event_time)
        .limit(1)
    )
    event = await session.scalar(stmt)
    return await as_read(session, event) if event else None


async def get_event(session: AsyncSession, event_id: uuid.UUID) -> Event:
    event = await session.scalar(select(Event).options(selectinload(Event.venue)).where(Event.id == event_id))
    if not event:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Event not found")
    return event


async def create_event(session: AsyncSession, payload: EventCreate) -> dict:
    venue = await session.get(Venue, payload.venue_id)
    if not venue:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Venue not found")
    event = Event(**payload.model_dump())
    session.add(event)
    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "You already have an event on that date") from exc
    event.venue = venue
    result = await as_read(session, event)
    # Notify all subscribers about the new event
    await _notify_all_subscribers(
        session,
        title="New Match Created!",
        body=f"{payload.created_by_name} created a match at {venue.name} on {payload.event_date.strftime('%a %d %b')} at {str(payload.event_time)[:5]}.",
        url=f"/events/{event.id}",
    )
    return result


async def cancel_event(session: AsyncSession, event_id: uuid.UUID, creator_name: str) -> dict:
    event = await get_event(session, event_id)
    if event.created_by_name.casefold() != creator_name.casefold():
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only the event creator can cancel it")
    event.status = EventStatus.CANCELLED
    await session.commit()
    result = await as_read(session, event)
    # Notify all registrants
    await _notify_registrants(
        session,
        event=event,
        title="Event Cancelled",
        body=f"The match at {event.venue.name} on {event.event_date.strftime('%d %b')} has been cancelled.",
        url=f"/events/{event.id}",
    )
    return result


async def delete_event(session: AsyncSession, event_id: uuid.UUID, creator_name: str) -> None:
    event = await get_event(session, event_id)
    if event.created_by_name.casefold() != creator_name.casefold():
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only the event creator can delete it")
    if event.status != EventStatus.CANCELLED:
        raise HTTPException(status.HTTP_409_CONFLICT, "Only cancelled events can be deleted")
    await session.delete(event)
    await session.commit()


async def _notify_registrants(
    session: AsyncSession,
    *,
    event: Event,
    title: str,
    body: str,
    url: str,
) -> None:
    """Best-effort push notification to all players registered for an event."""
    from app.core.config import get_settings
    settings = get_settings()
    full_url = f"{settings.app_public_url}{url}"
    stmt = (
        select(PushSubscription)
        .join(Registration, Registration.player_id == PushSubscription.player_id)
        .where(Registration.event_id == event.id)
    )
    subscriptions = list((await session.scalars(stmt)).all())
    for sub in subscriptions:
        notification_service.send_push(
            endpoint=sub.endpoint,
            p256dh=sub.p256dh,
            auth=sub.auth,
            title=title,
            body=body,
            url=full_url,
        )


async def _notify_all_subscribers(
    session: AsyncSession,
    *,
    title: str,
    body: str,
    url: str,
) -> None:
    """Best-effort push notification to every subscribed player (e.g. new event)."""
    from app.core.config import get_settings
    settings = get_settings()
    full_url = f"{settings.app_public_url}{url}"
    subscriptions = list((await session.scalars(select(PushSubscription))).all())
    for sub in subscriptions:
        notification_service.send_push(
            endpoint=sub.endpoint,
            p256dh=sub.p256dh,
            auth=sub.auth,
            title=title,
            body=body,
            url=full_url,
        )

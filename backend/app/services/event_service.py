import uuid
from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import desc, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Event, EventStatus, ListStatus, Registration, Venue
from app.schemas.event import EventCreate


async def _count(session: AsyncSession, event_id: uuid.UUID, list_status: ListStatus) -> int:
    stmt = select(func.count()).select_from(Registration).where(
        Registration.event_id == event_id,
        Registration.list_status == list_status,
    )
    return int(await session.scalar(stmt) or 0)


async def as_read(session: AsyncSession, event: Event) -> dict:
    return {
        "id": event.id,
        "venue": event.venue,
        "event_date": event.event_date,
        "event_time": event.event_time,
        "max_players": event.max_players,
        "created_by_name": event.created_by_name,
        "status": event.status,
        "teams_generated": event.teams_generated,
        "confirmed_count": await _count(session, event.id, ListStatus.CONFIRMED),
        "waitlist_count": await _count(session, event.id, ListStatus.WAITLIST),
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
    stmt = (
        select(Event)
        .options(selectinload(Event.venue))
        .where(Event.status == EventStatus.UPCOMING, Event.event_date >= date.today())
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
        raise HTTPException(status.HTTP_409_CONFLICT, "An event already exists on that date") from exc
    event.venue = venue
    return await as_read(session, event)


async def cancel_event(session: AsyncSession, event_id: uuid.UUID, creator_name: str) -> dict:
    event = await get_event(session, event_id)
    if event.created_by_name.casefold() != creator_name.casefold():
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only the event creator can cancel it")
    event.status = EventStatus.CANCELLED
    await session.commit()
    return await as_read(session, event)

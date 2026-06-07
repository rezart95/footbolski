import asyncio
import uuid
from datetime import datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy import and_, desc, func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Event, EventStatus, ListStatus, PushSubscription, Registration, Team, TeamPlayer, Venue
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
        "price_per_person": event.price_per_person,
        "pay_to_name": event.pay_to_name,
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
    # Notify all subscribers about the new event — fire and forget so the response is not blocked
    subs = list((await session.scalars(select(PushSubscription))).all())
    if subs:
        subs_data = [{"endpoint": s.endpoint, "p256dh": s.p256dh, "auth": s.auth} for s in subs]
        asyncio.ensure_future(_send_pushes_bg(
            subs_data,
            title="New Match Created!",
            body=f"{payload.created_by_name} created a match at {venue.name} on {payload.event_date.strftime('%a %d %b')} at {str(payload.event_time)[:5]}.",
            url=f"{_app_url()}/events/{event.id}",
        ))
    return result


async def cancel_event(session: AsyncSession, event_id: uuid.UUID, creator_name: str) -> dict:
    event = await get_event(session, event_id)
    if event.created_by_name.casefold() != creator_name.casefold():
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only the event creator can cancel it")
    event.status = EventStatus.CANCELLED
    await session.commit()
    result = await as_read(session, event)
    # Notify all registrants — fire and forget so the response is not blocked
    stmt = (
        select(PushSubscription)
        .join(Registration, Registration.player_id == PushSubscription.player_id)
        .where(Registration.event_id == event.id)
    )
    subs = list((await session.scalars(stmt)).all())
    if subs:
        subs_data = [{"endpoint": s.endpoint, "p256dh": s.p256dh, "auth": s.auth} for s in subs]
        asyncio.ensure_future(_send_pushes_bg(
            subs_data,
            title="Event Cancelled",
            body=f"The match at {event.venue.name} on {event.event_date.strftime('%d %b')} has been cancelled.",
            url=f"{_app_url()}/events/{event.id}",
        ))
    return result


async def delete_event(session: AsyncSession, event_id: uuid.UUID, creator_name: str) -> None:
    event = await get_event(session, event_id)
    if event.created_by_name.casefold() != creator_name.casefold():
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only the event creator can delete it")
    if event.status != EventStatus.CANCELLED:
        raise HTTPException(status.HTTP_409_CONFLICT, "Only cancelled events can be deleted")
    # Delete children explicitly — no DB-level CASCADE on these FKs
    team_ids = (await session.scalars(select(Team.id).where(Team.event_id == event_id))).all()
    if team_ids:
        await session.execute(TeamPlayer.__table__.delete().where(TeamPlayer.team_id.in_(team_ids)))
    await session.execute(Team.__table__.delete().where(Team.event_id == event_id))
    await session.execute(Registration.__table__.delete().where(Registration.event_id == event_id))
    await session.delete(event)
    await session.commit()


def _app_url() -> str:
    from app.core.config import get_settings
    return get_settings().app_public_url


async def _send_pushes_bg(subs_data: list[dict], *, title: str, body: str, url: str) -> None:
    """Background coroutine: sends push notifications in a thread pool (non-blocking)."""
    tasks = [
        asyncio.to_thread(
            notification_service.send_push,
            endpoint=s["endpoint"],
            p256dh=s["p256dh"],
            auth=s["auth"],
            title=title,
            body=body,
            url=url,
        )
        for s in subs_data
    ]
    await asyncio.gather(*tasks, return_exceptions=True)

import uuid
from datetime import UTC, datetime
from decimal import ROUND_CEILING, Decimal

from fastapi import HTTPException, status
from sqlalchemy import and_, desc, func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core import clock
from app.models import (
    Event,
    EventStatus,
    ListStatus,
    Registration,
    Reminder,
    ReminderKind,
    ReminderStatus,
    Team,
    TeamPlayer,
    Venue,
)
from app.schemas.event import EventCreate


async def _count(session: AsyncSession, event_id: uuid.UUID, list_status: ListStatus) -> int:
    stmt = select(func.count()).select_from(Registration).where(
        Registration.event_id == event_id,
        Registration.list_status == list_status,
    )
    return int(await session.scalar(stmt) or 0)


def effective_status(event: Event) -> EventStatus:
    """Return completed if the match has already finished, even if the DB still says upcoming.

    Compared in Warsaw local time — see `app.core.clock`. Using the server clock
    directly would keep finished matches marked upcoming for the length of the
    current UTC offset.
    """
    if event.status != EventStatus.UPCOMING:
        return event.status
    if clock.has_finished(event.event_date, event.event_time):
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
        "status": effective_status(event),
        "teams_generated": event.teams_generated,
        "confirmed_count": await _count(session, event.id, ListStatus.CONFIRMED),
        "waitlist_count": await _count(session, event.id, ListStatus.WAITLIST),
        "ai_reasoning": event.ai_reasoning,
        "ai_swap_options": event.ai_swap_options,
        "price_per_person": event.price_per_person,
        "pay_to_name": event.pay_to_name,
        "payment_method": event.payment_method,
        "payment_details": event.payment_details,
        "total_cost": event.total_cost,
        "cost_set_at": event.cost_set_at,
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
    # event_date/event_time hold Warsaw wall-clock, so the cutoff must be local
    # wall-clock too — comparing them against the server's UTC clock leaves a
    # finished match showing as the next event for hours.
    cutoff = clock.local_cutoff_for_finished()
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
    return await as_read(session, event)


def is_creator(event: Event, name: str) -> bool:
    """Whether `name` is the organiser of `event`.

    Matched case-insensitively and on first name alone, because the session name
    is free text with no auth (the same rule the Remind button uses).
    """
    claimed = name.strip().casefold()
    stored = event.created_by_name.strip().casefold()
    return bool(claimed) and (claimed == stored or claimed == stored.split()[0])


def split_cost(total_cost: Decimal, players: int) -> Decimal:
    """Each player's share of `total_cost`, rounded up to the next grosz.

    Rounding up means the group never collects less than the bill: 1000 zł over
    13 players is 76.93 each (1000.09 in total), not 76.92 (999.96).
    """
    return (Decimal(total_cost) / players).quantize(Decimal("0.01"), rounding=ROUND_CEILING)


async def _payment_requests_sent(session: AsyncSession, event_id: uuid.UUID) -> bool:
    stmt = select(func.count()).select_from(Reminder).where(
        Reminder.event_id == event_id,
        Reminder.kind == ReminderKind.PAYMENT,
        Reminder.status == ReminderStatus.SENT,
    )
    return bool(await session.scalar(stmt))


async def set_total_cost(
    session: AsyncSession, event_id: uuid.UUID, creator_name: str, total_cost: Decimal
) -> dict:
    """Record what the pitch actually cost and derive the per-person price.

    Used for matches priced after full time (Fame Sport, where Multisport cards
    change the bill every week). The split is over the confirmed players, so it is
    only allowed once the match is over and the list can no longer change. The
    WhatsApp payment request is scheduled from `cost_set_at`.
    """
    event = await get_event(session, event_id)
    if not is_creator(event, creator_name):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only the event creator can set the amount")

    current = effective_status(event)
    if current == EventStatus.CANCELLED:
        raise HTTPException(status.HTTP_409_CONFLICT, "A cancelled match has no cost")
    if current != EventStatus.COMPLETED:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Set the amount after the match, so it is split over everyone who played",
        )
    if event.total_cost is None and event.price_per_person is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "This match has a fixed price per person")

    players = await _count(session, event.id, ListStatus.CONFIRMED)
    if players == 0:
        raise HTTPException(status.HTTP_409_CONFLICT, "Nobody played, so there is nothing to split")
    if await _payment_requests_sent(session, event.id):
        raise HTTPException(
            status.HTTP_409_CONFLICT, "Payment requests have already gone out, so the amount can't change"
        )

    event.total_cost = total_cost
    event.price_per_person = split_cost(total_cost, players)
    event.cost_set_at = datetime.now(UTC)
    await session.commit()
    return await as_read(session, event)


async def cancel_event(session: AsyncSession, event_id: uuid.UUID, creator_name: str) -> dict:
    event = await get_event(session, event_id)
    if event.created_by_name.casefold() != creator_name.casefold():
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only the event creator can cancel it")
    event.status = EventStatus.CANCELLED
    await session.commit()
    return await as_read(session, event)


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

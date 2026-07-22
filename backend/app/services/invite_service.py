"""Dispatching invite rungs and resolving the links they contain.

Exactly-once delivery is enforced per **recipient**, not per rung: the
`action_tokens` row is committed before the message is sent, and its unique
constraint on (purpose, event_id, player_id) means a crash mid-sweep can neither
double-send nor skip. A player who was invited at T-5 is therefore never invited
again at T-3, which is the audience-delta rule.
"""

import uuid

from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.models import (
    ActionToken,
    Event,
    EventStatus,
    ListStatus,
    Player,
    Registration,
    ReminderKind,
    TokenPurpose,
    Venue,
    generate_token,
)
from app.services import localised_dates, message_delivery, message_templates
from app.services.ladder_schedule import LadderRung


async def seats_remaining(session: AsyncSession, event: Event) -> int:
    confirmed = await session.scalar(
        select(func.count())
        .select_from(Registration)
        .where(Registration.event_id == event.id, Registration.list_status == ListStatus.CONFIRMED)
    )
    return max(0, event.max_players - int(confirmed or 0))


async def _already_registered_player_ids(session: AsyncSession, event_id: uuid.UUID) -> set[uuid.UUID]:
    rows = await session.scalars(
        select(Registration.player_id).where(
            Registration.event_id == event_id, Registration.player_id.isnot(None)
        )
    )
    return {row for row in rows if row is not None}


async def _already_invited_player_ids(session: AsyncSession, event_id: uuid.UUID) -> set[uuid.UUID]:
    rows = await session.scalars(
        select(ActionToken.player_id).where(
            ActionToken.event_id == event_id, ActionToken.purpose == TokenPurpose.INVITE.value
        )
    )
    return set(rows)


async def audience_for(session: AsyncSession, event: Event, rung: LadderRung) -> list[Player]:
    """Players this rung should reach.

    Excludes anyone already registered, anyone already invited for this event,
    anyone with no usable number, and anyone opted out. The registration check
    is by `player_id`, so it only works once registrations are linked to player
    cards; unlinked name-only registrations can still be invited twice.
    """
    registered = await _already_registered_player_ids(session, event.id)
    invited = await _already_invited_player_ids(session, event.id)

    candidates = await session.scalars(
        select(Player).where(
            Player.tier.in_(rung.tiers),
            Player.phone_number.isnot(None),
            Player.opted_out_at.is_(None),
        )
    )
    return [
        player
        for player in candidates
        if player.id not in registered and player.id not in invited
    ]


async def issue_token(
    session: AsyncSession, *, event_id: uuid.UUID, player_id: uuid.UUID, purpose: TokenPurpose
) -> ActionToken | None:
    """Claim the dispatch slot for one recipient.

    Returns None if a token already exists, which means somebody else already
    sent this message. Uses ON CONFLICT DO NOTHING so two concurrent ticks
    cannot both win.
    """
    statement = (
        insert(ActionToken)
        .values(
            id=uuid.uuid4(),
            token=generate_token(),
            purpose=purpose.value,
            event_id=event_id,
            player_id=player_id,
        )
        .on_conflict_do_nothing(constraint="uq_action_token_dispatch")
        .returning(ActionToken.id)
    )
    claimed_id = await session.scalar(statement)
    if claimed_id is None:
        return None
    return await session.get(ActionToken, claimed_id)


async def venue_name(session: AsyncSession, event: Event) -> str:
    """Resolve the venue name without relying on the caller having eager-loaded it.

    Touching `event.venue` lazily inside async code raises MissingGreenlet, and
    whether it is loaded depends on which query produced the event. Fetching it
    explicitly removes that coupling.
    """
    venue = await session.get(Venue, event.venue_id)
    return venue.name if venue else "the usual pitch"


def invite_body(player: Player, event: Event, seats: int, token: str, venue: str) -> str:
    settings = get_settings()
    return message_templates.render(
        message_templates.INVITE,
        player.preferred_language,
        name=message_templates.first_name(player.name),
        when=localised_dates.format_when(event.event_date, event.event_time, player.preferred_language),
        venue=venue,
        seats=seats,
        link=f"{settings.app_public_url}/invite/{token}",
    )


async def dispatch_rung(session: AsyncSession, event: Event, rung: LadderRung) -> dict[str, int]:
    """Send one rung. Returns a per-outcome tally; never raises for a bad recipient."""
    seats = await seats_remaining(session, event)
    if seats <= 0:
        return {"skipped_event_full": 1}

    audience = await audience_for(session, event, rung)
    tally: dict[str, int] = {"attempted": len(audience)}
    where = await venue_name(session, event)

    for player in audience:
        token = await issue_token(
            session, event_id=event.id, player_id=player.id, purpose=TokenPurpose.INVITE
        )
        if token is None:
            tally["already_dispatched"] = tally.get("already_dispatched", 0) + 1
            continue

        # Commit the ledger row before sending, so a crash leaves a recorded
        # dispatch with no message rather than a message with no record.
        await session.commit()

        outcome, _row = await message_delivery.deliver(
            session,
            player=player,
            event_id=event.id,
            kind=ReminderKind.INVITE,
            body=invite_body(player, event, seats, token.token, where),
        )
        await session.commit()
        tally[outcome.reason.value] = tally.get(outcome.reason.value, 0) + 1

    return tally


async def load_event_for_dispatch(session: AsyncSession, event_id: uuid.UUID) -> Event | None:
    event = await session.scalar(
        select(Event).options(selectinload(Event.venue)).where(Event.id == event_id)
    )
    if event is None or event.status is EventStatus.CANCELLED:
        return None
    return event

"""The individual jobs a scheduler tick runs: invites, payment reminders, ballots.

Each job takes one event and returns a tally. None of them raise for an ordinary
delivery problem, because the tick loops over every event and one bad recipient
must not end the sweep.

Every job is guarded by a durable marker so running it twice sends nothing twice:
an `action_tokens` row for invites and ballots, and a `reminders` row of the
matching kind for payment.
"""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core import clock
from app.core.config import get_settings
from app.models import (
    Event,
    ListStatus,
    Registration,
    ReminderKind,
    SystemState,
    TokenPurpose,
)
from app.services import (
    invite_service,
    ladder_schedule,
    localised_dates,
    message_delivery,
    message_log,
    message_templates,
    motm_service,
)

RUNG_STATE_PREFIX = "ladder_rungs:"


async def _fired_rungs(session: AsyncSession, event_id: uuid.UUID) -> set[int]:
    state = await session.get(SystemState, f"{RUNG_STATE_PREFIX}{event_id}")
    if state is None or not state.value:
        return set()
    return {int(part) for part in state.value.split(",") if part.strip()}


async def _remember_rungs(session: AsyncSession, event_id: uuid.UUID, fired: set[int]) -> None:
    key = f"{RUNG_STATE_PREFIX}{event_id}"
    value = ",".join(str(index) for index in sorted(fired))
    state = await session.get(SystemState, key)
    if state is None:
        session.add(SystemState(key=key, value=value))
    else:
        state.value = value
    await session.commit()


async def run_invite_ladder(session: AsyncSession, event: Event) -> dict:
    """Fire whichever rung is due for this event, at most one per tick."""
    fired = await _fired_rungs(session, event.id)
    rung = ladder_schedule.rung_to_fire(event.event_date, fired)
    if rung is None:
        return {}

    if await invite_service.seats_remaining(session, event) <= 0:
        # Full. Mark every due rung spent so this event is never messaged about again.
        due = ladder_schedule.due_rungs(event.event_date)
        await _remember_rungs(session, event.id, fired | {r.index for r in due})
        return {"event": str(event.id), "skipped": "event full"}

    tally = await invite_service.dispatch_rung(session, event, rung)

    # The fired rung plus any it supersedes are now spent. Firing the narrower
    # ones afterwards would send a burst minutes apart to people the wider rung
    # has already reached.
    superseded = ladder_schedule.superseded_rungs(event.event_date, rung, fired)
    await _remember_rungs(session, event.id, fired | {rung.index} | {r.index for r in superseded})
    return {"event": str(event.id), "rung": rung.index, "days_before": rung.days_before, **tally}


async def run_payment_reminders(session: AsyncSession, event: Event) -> dict:
    """One reminder per unpaid confirmed player, at T-1."""
    if clock.now_local() < ladder_schedule.payment_reminder_due_at(event.event_date):
        return {}

    registrations = await session.scalars(
        select(Registration)
        .options(selectinload(Registration.player))
        .where(
            Registration.event_id == event.id,
            Registration.list_status == ListStatus.CONFIRMED,
            Registration.has_paid.is_(False),
            Registration.player_id.isnot(None),
        )
    )

    settings = get_settings()
    where = await invite_service.venue_name(session, event)
    tally: dict[str, int] = {}

    for registration in registrations:
        player = registration.player
        if player is None:
            continue
        if await message_log.already_sent(session, event.id, player.id, ReminderKind.PAYMENT):
            tally["already_sent"] = tally.get("already_sent", 0) + 1
            continue

        language = player.preferred_language
        body = message_templates.render(
            message_templates.PAYMENT_REMINDER,
            language,
            name=message_templates.first_name(registration.display_name),
            when=localised_dates.format_when(event.event_date, event.event_time, language),
            amount=f"{event.price_per_person:g} zł" if event.price_per_person else "your share",
            handle=event.payment_details or event.pay_to_name or "the organiser",
            method=(event.payment_method or "transfer").replace("_", " "),
            link=f"{settings.app_public_url}/events/{event.id}",
            venue=where,
        )
        outcome, _row = await message_delivery.deliver(
            session,
            player=player,
            event_id=event.id,
            kind=ReminderKind.PAYMENT,
            body=body,
            registration_id=registration.id,
        )
        await session.commit()
        tally[outcome.reason.value] = tally.get(outcome.reason.value, 0) + 1

    return {"event": str(event.id), **tally} if tally else {}


async def run_motm_ballots(session: AsyncSession, event: Event) -> dict:
    """Send the ballot link once the match has finished and the window is open."""
    now = clock.now_local()
    opens_at = ladder_schedule.motm_opens_at(event.event_date, event.event_time)
    closes_at = ladder_schedule.motm_closes_at(event.event_date, event.event_time)
    if not (opens_at <= now < closes_at):
        return {}
    if not ladder_schedule.within_quiet_hours(now):
        return {}

    candidates = await motm_service.confirmed_players(session, event.id)
    if len(candidates) < motm_service.MINIMUM_CANDIDATES:
        return {}

    settings = get_settings()
    tally: dict[str, int] = {}

    for player in candidates:
        token = await invite_service.issue_token(
            session, event_id=event.id, player_id=player.id, purpose=TokenPurpose.MOTM
        )
        if token is None:
            tally["already_dispatched"] = tally.get("already_dispatched", 0) + 1
            continue
        await session.commit()

        body = message_templates.render(
            message_templates.MOTM_BALLOT,
            player.preferred_language,
            name=message_templates.first_name(player.name),
            link=f"{settings.app_public_url}/motm/{token.token}",
        )
        outcome, _row = await message_delivery.deliver(
            session, player=player, event_id=event.id, kind=ReminderKind.MOTM, body=body
        )
        await session.commit()
        tally[outcome.reason.value] = tally.get(outcome.reason.value, 0) + 1

    return {"event": str(event.id), **tally} if tally else {}

"""The periodic tick that drives invites, payment reminders and ballots.

Triggered externally by a Coolify scheduled task calling the internal endpoint,
rather than by an in-process timer: the homeserver is a laptop that reboots, and
an in-process scheduler dies with it without anyone noticing.

Two properties matter more than anything else:

**It never stops on one failure.** Each event is handled independently and each
job returns a tally rather than raising, so one broken event or one bad phone
number cannot end the sweep.

**It is safe to run twice.** Every action is guarded by a durable marker, so
running the tick twice, or catching up after the laptop slept through several
ticks, sends nothing twice.

The individual jobs live in `scheduled_jobs`; this module is the loop around them.
"""

import logging
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core import clock
from app.models import LAST_SCHEDULER_TICK, Event, EventStatus, SystemState
from app.services import ladder_schedule, scheduled_jobs

logger = logging.getLogger(__name__)

RECENT_EVENTS_FOR_BALLOTS = 5
"""How far back to look for matches whose ballot may still be due."""


async def _record_heartbeat(session: AsyncSession) -> None:
    """Stamp the tick time so a dead scheduler is visible.

    Without this, "the ladder ran and nobody replied" and "the ladder has been
    dead since Tuesday" look identical from the outside.
    """
    state = await session.get(SystemState, LAST_SCHEDULER_TICK)
    now = datetime.now(UTC).isoformat()
    if state is None:
        session.add(SystemState(key=LAST_SCHEDULER_TICK, value=now))
    else:
        state.value = now
    await session.commit()


async def last_tick_at(session: AsyncSession) -> str | None:
    state = await session.get(SystemState, LAST_SCHEDULER_TICK)
    return state.value if state else None


async def _persist_completed_statuses(session: AsyncSession) -> int:
    """Write the completed status that was previously only computed on read.

    `_effective_status` reports a finished match as completed without saving it,
    so every query filtering on the stored column disagreed with what the UI
    showed. This reconciles them.
    """
    events = await session.scalars(select(Event).where(Event.status == EventStatus.UPCOMING))
    changed = 0
    for event in events:
        if clock.has_finished(event.event_date, event.event_time):
            event.status = EventStatus.COMPLETED
            changed += 1
    if changed:
        await session.commit()
    return changed


async def _upcoming_events(session: AsyncSession) -> list[Event]:
    result = await session.scalars(
        select(Event).options(selectinload(Event.venue)).where(Event.status == EventStatus.UPCOMING)
    )
    return list(result)


async def _recently_completed(session: AsyncSession) -> list[Event]:
    result = await session.scalars(
        select(Event)
        .options(selectinload(Event.venue))
        .where(Event.status == EventStatus.COMPLETED)
        .order_by(Event.event_date.desc())
        .limit(RECENT_EVENTS_FOR_BALLOTS)
    )
    return list(result)


async def run_tick(session: AsyncSession) -> dict:
    """One scheduler pass. Always records a heartbeat, even if the work fails."""
    started = clock.now_local()
    report: dict[str, object] = {"ran_at": started.isoformat(), "quiet_hours_ok": True}

    # Status reconciliation runs regardless of the hour: it sends nothing.
    report["completed_marked"] = await _persist_completed_statuses(session)

    if not ladder_schedule.within_quiet_hours(started):
        report["quiet_hours_ok"] = False
        await _record_heartbeat(session)
        return report

    invites: list[dict] = []
    payments: list[dict] = []
    for event in await _upcoming_events(session):
        try:
            if result := await scheduled_jobs.run_invite_ladder(session, event):
                invites.append(result)
            if result := await scheduled_jobs.run_payment_reminders(session, event):
                payments.append(result)
        except Exception:
            # One broken event must not stop the rest of the sweep.
            await session.rollback()
            logger.exception("Scheduler failed on event %s", event.id)

    ballots: list[dict] = []
    for event in await _recently_completed(session):
        try:
            if result := await scheduled_jobs.run_motm_ballots(session, event):
                ballots.append(result)
        except Exception:
            await session.rollback()
            logger.exception("Ballot dispatch failed on event %s", event.id)

    report["invites"] = invites
    report["payment_reminders"] = payments
    report["motm_ballots"] = ballots

    await _record_heartbeat(session)
    return report

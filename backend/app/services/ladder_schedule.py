"""When each rung of the invite ladder is due, and whether we may send now.

Pure functions over dates and times. No database, no sending, so the awkward
cases (DST transitions, collapsed rungs, quiet hours) can be reasoned about and
checked directly.

Fairness here is by **timing, not visibility**. Every rung only ever widens the
audience, so nobody loses a seat to a later rung; core players simply hear first.
"""

from dataclasses import dataclass
from datetime import date, datetime, time, timedelta

from app.core import clock
from app.core.config import get_settings

CORE_TIER = "core"
REST_TIER = "rest"

DISPATCH_HOUR = 18
"""Rungs fire at 18:00 local. Late enough that people have their phones,
early enough to be inside quiet hours on any day of the year."""


@dataclass(frozen=True)
class LadderRung:
    """One step of the ladder."""

    index: int
    days_before: int
    tiers: tuple[str, ...]

    @property
    def is_widest(self) -> bool:
        return REST_TIER in self.tiers


def rungs() -> list[LadderRung]:
    """Build the ladder from configuration, soonest-firing last.

    The first rung reaches core players only; every later rung reaches everyone.
    Configured as days before kickoff, e.g. "5,3".
    """
    raw = get_settings().invite_ladder_days
    days = sorted({int(part) for part in raw.split(",") if part.strip()}, reverse=True)
    return [
        LadderRung(
            index=position,
            days_before=day_count,
            tiers=(CORE_TIER,) if position == 0 else (CORE_TIER, REST_TIER),
        )
        for position, day_count in enumerate(days)
    ]


def due_at(event_date: date, days_before: int) -> datetime:
    """The local instant a rung becomes due.

    Built from the local calendar date rather than by subtracting hours, so a
    rung that spans a DST boundary still lands at 18:00 local on the right day.
    """
    target_day = event_date - timedelta(days=days_before)
    return clock.to_local(target_day, time(DISPATCH_HOUR, 0))


def within_quiet_hours(moment: datetime | None = None) -> bool:
    """True if it is currently acceptable to message somebody."""
    settings = get_settings()
    now = moment or clock.now_local()
    return settings.quiet_hours_start <= now.hour < settings.quiet_hours_end


def due_rungs(event_date: date, now: datetime | None = None) -> list[LadderRung]:
    """Every rung whose time has come, oldest first."""
    moment = now or clock.now_local()
    return [rung for rung in rungs() if moment >= due_at(event_date, rung.days_before)]


def rung_to_fire(
    event_date: date, already_fired: set[int], now: datetime | None = None
) -> LadderRung | None:
    """Pick the single rung to fire, or None.

    If several fell due while the server was asleep, only the **widest** is
    fired and the rest are treated as spent. Firing them in sequence would send
    a burst of messages minutes apart, and the widest already covers everyone
    the narrower ones would have reached.
    """
    pending = [rung for rung in due_rungs(event_date, now) if rung.index not in already_fired]
    if not pending:
        return None
    return max(pending, key=lambda rung: rung.index)


def superseded_rungs(
    event_date: date, chosen: LadderRung, already_fired: set[int], now: datetime | None = None
) -> list[LadderRung]:
    """Rungs that fell due but are covered by the one being fired."""
    return [
        rung
        for rung in due_rungs(event_date, now)
        if rung.index not in already_fired and rung.index != chosen.index
    ]


def payment_reminder_due_at(event_date: date) -> datetime:
    return due_at(event_date, get_settings().payment_reminder_days_before)


def motm_opens_at(event_date: date, event_time: time) -> datetime:
    """Ballot opens shortly after full time."""
    settings = get_settings()
    return clock.to_local(event_date, event_time) + timedelta(minutes=settings.motm_open_after_minutes)


def motm_closes_at(event_date: date, event_time: time) -> datetime:
    settings = get_settings()
    return motm_opens_at(event_date, event_time) + timedelta(hours=settings.motm_window_hours)

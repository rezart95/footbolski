"""Time helpers anchored to the group's local timezone.

Events store `event_date` and `event_time` as naive values that mean **Warsaw
wall-clock** — the group plays at 19:30 Warsaw, not 19:30 UTC. The server runs in
a container whose local time is UTC, so comparing those columns against a bare
`datetime.now()` is wrong by the current UTC offset (2h in summer, 1h in winter):
a finished match keeps reporting as upcoming for hours.

Everything that reasons about when a match happens goes through this module so
the offset is applied in exactly one place. DST is handled by `zoneinfo`, which
is why 18:00 local stays 18:00 local across the March and October transitions.
"""

from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

LOCAL_TZ = ZoneInfo("Europe/Warsaw")

MATCH_DURATION_MINUTES = 90
"""How long a match runs. An event is treated as completed once this has elapsed."""


def now_local() -> datetime:
    """Current time as an aware datetime in the group's timezone."""
    return datetime.now(LOCAL_TZ)


def to_local(event_date: date, event_time: time) -> datetime:
    """Combine a stored date and time into an aware local datetime."""
    return datetime.combine(event_date, event_time, tzinfo=LOCAL_TZ)


def match_end(event_date: date, event_time: time) -> datetime:
    """When the match is considered over."""
    return to_local(event_date, event_time) + timedelta(minutes=MATCH_DURATION_MINUTES)


def has_finished(event_date: date, event_time: time) -> bool:
    """True once the match plus its duration has passed in local time."""
    return now_local() > match_end(event_date, event_time)


def local_cutoff_for_finished() -> datetime:
    """The local wall-clock instant that separates finished matches from upcoming ones.

    Returned as an aware datetime; use `.date()` and `.time()` when comparing
    against the naive `event_date` / `event_time` columns, which hold local
    wall-clock values in the same timezone.
    """
    return now_local() - timedelta(minutes=MATCH_DURATION_MINUTES)

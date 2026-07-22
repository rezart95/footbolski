"""Weekday and month names for messages, independent of the server's locale.

`strftime('%a %d %b')` uses the server's C locale, which is not guaranteed to
be English on every host this runs on. Spelling these out avoids that
dependency entirely.

English only, for now — matches `message_templates`. Kept keyed by language
rather than hardcoded to English so re-adding a language later is adding a row
to these tables, not restructuring the module.

Abbreviated forms throughout, because these appear inside WhatsApp messages
where length pushes toward another billable segment.
"""

from datetime import date, time

WEEKDAYS: dict[str, tuple[str, ...]] = {
    "en": ("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"),
}

MONTHS: dict[str, tuple[str, ...]] = {
    "en": ("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"),
}

FALLBACK = "en"


def _names(table: dict[str, tuple[str, ...]], language: str | None) -> tuple[str, ...]:
    return table.get(language or FALLBACK, table[FALLBACK])


def format_when(event_date: date, event_time: time, language: str | None) -> str:
    """Render a kickoff as "Thu 23 Jul 19:30"."""
    weekday = _names(WEEKDAYS, language)[event_date.weekday()]
    month = _names(MONTHS, language)[event_date.month - 1]
    return f"{weekday} {event_date.day} {month} {event_time.strftime('%H:%M')}"


def format_day(event_date: date, language: str | None) -> str:
    """Render a date without a time, for messages that do not need one."""
    weekday = _names(WEEKDAYS, language)[event_date.weekday()]
    month = _names(MONTHS, language)[event_date.month - 1]
    return f"{weekday} {event_date.day} {month}"

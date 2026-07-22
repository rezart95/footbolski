"""Weekday and month names for the languages we message in.

`strftime('%a %d %b')` uses the server's C locale, so a Polish message ended up
reading "piłka w Thu 23 Jul". Setting the process locale per message is not an
option: it is global state and not thread-safe, and every send runs on a worker
thread.

Abbreviated forms throughout, because these appear inside WhatsApp messages where
length pushes toward another billable segment.
"""

from datetime import date, time

WEEKDAYS: dict[str, tuple[str, ...]] = {
    "en": ("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"),
    "pl": ("pon", "wt", "śr", "czw", "pt", "sob", "niedz"),
    "es": ("lun", "mar", "mié", "jue", "vie", "sáb", "dom"),
    "pt": ("seg", "ter", "qua", "qui", "sex", "sáb", "dom"),
    "sq": ("hën", "mar", "mër", "enj", "pre", "sht", "die"),
    "uk": ("пн", "вт", "ср", "чт", "пт", "сб", "нд"),
}

MONTHS: dict[str, tuple[str, ...]] = {
    "en": ("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"),
    "pl": ("sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"),
    "es": ("ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"),
    "pt": ("jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"),
    "sq": ("jan", "shk", "mar", "pri", "maj", "qer", "korr", "gush", "sht", "tet", "nën", "dhj"),
    "uk": ("січ", "лют", "бер", "кві", "тра", "чер", "лип", "сер", "вер", "жов", "лис", "гру"),
}

FALLBACK = "en"


def _names(table: dict[str, tuple[str, ...]], language: str | None) -> tuple[str, ...]:
    return table.get(language or FALLBACK, table[FALLBACK])


def format_when(event_date: date, event_time: time, language: str | None) -> str:
    """Render a kickoff as "czw 23 lip 19:30" in the recipient's language."""
    weekday = _names(WEEKDAYS, language)[event_date.weekday()]
    month = _names(MONTHS, language)[event_date.month - 1]
    return f"{weekday} {event_date.day} {month} {event_time.strftime('%H:%M')}"


def format_day(event_date: date, language: str | None) -> str:
    """Render a date without a time, for messages that do not need one."""
    weekday = _names(WEEKDAYS, language)[event_date.weekday()]
    month = _names(MONTHS, language)[event_date.month - 1]
    return f"{weekday} {event_date.day} {month}"

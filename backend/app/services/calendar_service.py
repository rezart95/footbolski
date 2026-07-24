"""Building a single-event .ics file for "Add to Calendar".

Served by the API (see `api/v1/events.py`) with a `text/calendar` content
type rather than generated client-side as a downloaded blob — that's what
lets a tap open the device's native "Add Event" sheet directly, the same way
a `.vcf` link opens "Add Contact", instead of forcing a file save the user
then has to go find and reopen.

Timestamps are emitted in UTC (`...Z`) rather than as local wall-clock time
with a TZID, so no VTIMEZONE block is needed — `app.core.clock` already
handles the Warsaw-local-to-UTC conversion correctly across DST via
`zoneinfo`.
"""

from datetime import datetime, timezone

from app.core import clock
from app.core.config import get_settings
from app.models import Event


def _escape(text: str) -> str:
    """RFC 5545 §3.3.11 text escaping (backslash, semicolon, comma, newline)."""
    return text.replace("\\", "\\\\").replace(";", "\\;").replace(",", "\\,").replace("\n", "\\n")


def _stamp(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def build_event_ics(event: Event) -> str:
    start = clock.to_local(event.event_date, event.event_time)
    end = clock.match_end(event.event_date, event.event_time)
    url = f"{get_settings().app_public_url}/events/{event.id}"

    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Footbolski//Event//EN",
        "CALSCALE:GREGORIAN",
        "BEGIN:VEVENT",
        f"UID:{event.id}@footbolski.org",
        f"DTSTAMP:{_stamp(clock.now_local())}",
        f"DTSTART:{_stamp(start)}",
        f"DTEND:{_stamp(end)}",
        f"SUMMARY:{_escape(f'Football at {event.venue.name}')}",
    ]
    if event.venue.address:
        lines.append(f"LOCATION:{_escape(event.venue.address)}")
    lines += [
        f"DESCRIPTION:{_escape(f'Details and payment info: {url}')}",
        f"URL:{url}",
        "END:VEVENT",
        "END:VCALENDAR",
    ]
    return "\r\n".join(lines) + "\r\n"

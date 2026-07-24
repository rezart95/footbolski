import type { EventSummary } from "../types/event.types";

/** Kept in sync with `MATCH_DURATION_MINUTES` in `backend/app/core/clock.py`. */
const MATCH_DURATION_MINUTES = 90;

/** Static VTIMEZONE block for Europe/Warsaw (EU DST rule: last Sunday of March
 * and October). `event_date`/`event_time` are stored as naive Warsaw wall-clock
 * values (see `backend/app/core/clock.py`), so the .ics needs this block —
 * without it, calendar apps would guess the reader's own timezone instead. */
const VTIMEZONE_WARSAW = [
  "BEGIN:VTIMEZONE",
  "TZID:Europe/Warsaw",
  "BEGIN:DAYLIGHT",
  "TZOFFSETFROM:+0100",
  "TZOFFSETTO:+0200",
  "TZNAME:CEST",
  "DTSTART:19700329T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
  "END:DAYLIGHT",
  "BEGIN:STANDARD",
  "TZOFFSETFROM:+0200",
  "TZOFFSETTO:+0100",
  "TZNAME:CET",
  "DTSTART:19701025T030000",
  "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
  "END:STANDARD",
  "END:VTIMEZONE",
].join("\r\n");

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Formats `event_date` + `event_time` (+ optional minute offset) as a local
 * iCalendar timestamp (`YYYYMMDDTHHMMSS`, no zone suffix — paired with
 * `TZID=Europe/Warsaw` on the property). Uses `Date.UTC` purely as a
 * date-arithmetic scratchpad (for day rollover past midnight); nothing here
 * touches the browser's own timezone. */
function icsLocalDateTime(dateStr: string, timeStr: string, addMinutes = 0): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  const totalMinutes = hh * 60 + mm + addMinutes;
  const dayOffset = Math.floor(totalMinutes / (24 * 60));
  const minuteOfDay = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);

  const day = new Date(Date.UTC(y, m - 1, d));
  day.setUTCDate(day.getUTCDate() + dayOffset);

  const finalHH = Math.floor(minuteOfDay / 60);
  const finalMM = minuteOfDay % 60;
  return `${day.getUTCFullYear()}${pad(day.getUTCMonth() + 1)}${pad(day.getUTCDate())}T${pad(finalHH)}${pad(finalMM)}00`;
}

/** Escapes text per RFC 5545 §3.3.11 (backslash, semicolon, comma, newline). */
function icsEscape(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function utcStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

/** Builds a single-event .ics file so a player can add the match to their own
 * calendar app — Apple, Google and Outlook all import this format directly. */
export function buildEventIcs(event: EventSummary): string {
  const start = icsLocalDateTime(event.event_date, event.event_time);
  const end = icsLocalDateTime(event.event_date, event.event_time, MATCH_DURATION_MINUTES);
  const url = `${window.location.origin}/events/${event.id}`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Footbolski//Event//EN",
    "CALSCALE:GREGORIAN",
    VTIMEZONE_WARSAW,
    "BEGIN:VEVENT",
    `UID:${event.id}@footbolski.org`,
    `DTSTAMP:${utcStamp(new Date())}`,
    `DTSTART;TZID=Europe/Warsaw:${start}`,
    `DTEND;TZID=Europe/Warsaw:${end}`,
    `SUMMARY:${icsEscape(`Football at ${event.venue.name}`)}`,
    event.venue.address ? `LOCATION:${icsEscape(event.venue.address)}` : null,
    `DESCRIPTION:${icsEscape(`Details and payment info: ${url}`)}`,
    `URL:${url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter((line): line is string => line !== null);

  return lines.join("\r\n");
}

/** Triggers a browser download of the .ics file — tapping it opens the
 * device's default calendar app to import the event (iOS, Android, desktop). */
export function downloadEventIcs(event: EventSummary): void {
  const ics = buildEventIcs(event);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `footbolski-${event.event_date}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

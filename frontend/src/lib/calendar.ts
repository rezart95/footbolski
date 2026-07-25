import { api } from "./axios";
import type { EventSummary } from "../types/event.types";

/** Kept in sync with `MATCH_DURATION_MINUTES` in `backend/app/core/clock.py`. */
const MATCH_MINUTES = 90;
const TZ = "Europe/Warsaw";

/** The .ics file, served by the backend with a `text/calendar` content type.
 * On iOS this opens the native "Add Event" sheet directly; on Android/desktop
 * browsers it saves the file, which the calendar app then imports. This is the
 * only route that reaches Apple Calendar, so it's the "Apple / other" option. */
export function eventCalendarUrl(eventId: string): string {
  return `${api.defaults.baseURL}/events/${eventId}/calendar.ics`;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Split `event_date` + `event_time` (+ optional minutes) into calendar parts,
 * rolling over past midnight. Dates arrive as "YYYY-MM-DD" (sometimes with a
 * trailing "T..."); times as "HH:MM" or "HH:MM:SS". `Date.UTC` is used only as
 * a day-arithmetic scratchpad — the browser's own timezone never enters in. */
function parts(dateStr: string, timeStr: string, addMinutes: number) {
  const [y, m, d] = dateStr.split("T")[0].split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  const total = hh * 60 + mm + addMinutes;
  const dayOffset = Math.floor(total / 1440);
  const minute = ((total % 1440) + 1440) % 1440;
  const day = new Date(Date.UTC(y, m - 1, d));
  day.setUTCDate(day.getUTCDate() + dayOffset);
  return {
    Y: day.getUTCFullYear(),
    M: pad(day.getUTCMonth() + 1),
    D: pad(day.getUTCDate()),
    h: pad(Math.floor(minute / 60)),
    m: pad(minute % 60),
  };
}

/** Local wall-clock basic format "YYYYMMDDTHHMMSS" (no zone) — paired with a
 * `ctz` parameter so the provider applies Warsaw time itself, no UTC maths. */
function localBasic(dateStr: string, timeStr: string, addMinutes = 0): string {
  const p = parts(dateStr, timeStr, addMinutes);
  return `${p.Y}${p.M}${p.D}T${p.h}${p.m}00`;
}

/** Warsaw's UTC offset on a given date, like "+02:00" — DST-aware via `Intl`. */
function warsawOffset(dateStr: string, timeStr: string): string {
  const instant = new Date(`${dateStr.split("T")[0]}T${timeStr.length === 5 ? timeStr : timeStr.slice(0, 5)}:00Z`);
  const name = new Intl.DateTimeFormat("en-US", { timeZone: TZ, timeZoneName: "longOffset" })
    .formatToParts(instant)
    .find((x) => x.type === "timeZoneName")?.value;
  const off = (name ?? "GMT+00:00").replace("GMT", "");
  return off === "" ? "+00:00" : off;
}

/** ISO 8601 with the Warsaw offset baked in, e.g. "2026-07-20T19:00:00+02:00". */
function localIso(dateStr: string, timeStr: string, addMinutes = 0): string {
  const p = parts(dateStr, timeStr, addMinutes);
  return `${p.Y}-${p.M}-${p.D}T${p.h}:${p.m}:00${warsawOffset(dateStr, timeStr)}`;
}

function title(event: EventSummary): string {
  return `Football at ${event.venue.name}`;
}

function details(event: EventSummary): string {
  return `Details and payment info: ${window.location.origin}/events/${event.id}`;
}

function place(event: EventSummary): string {
  return event.venue.address ?? event.venue.name;
}

/** Opens Google Calendar (web or app) with the match pre-filled — one tap to
 * save, no file download. */
export function googleCalendarUrl(event: EventSummary): string {
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: title(event),
    dates: `${localBasic(event.event_date, event.event_time)}/${localBasic(event.event_date, event.event_time, MATCH_MINUTES)}`,
    ctz: TZ,
    details: details(event),
    location: place(event),
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

/** Opens Outlook's calendar compose with the match pre-filled — no download. */
export function outlookCalendarUrl(event: EventSummary): string {
  const p = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: title(event),
    startdt: localIso(event.event_date, event.event_time),
    enddt: localIso(event.event_date, event.event_time, MATCH_MINUTES),
    location: place(event),
    body: details(event),
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${p.toString()}`;
}

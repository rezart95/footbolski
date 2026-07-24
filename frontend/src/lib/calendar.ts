import { api } from "./axios";

/** URL for the event's .ics file, served by the backend with a `text/calendar`
 * content type so a tap opens the device's native "Add to Calendar" sheet
 * directly — link to this with a plain `<a href>`, not a downloaded blob. */
export function eventCalendarUrl(eventId: string): string {
  return `${api.defaults.baseURL}/events/${eventId}/calendar.ics`;
}

import { api } from "../lib/axios";
import type { EventPayload, EventSummary, Venue } from "../types/event.types";

export async function listVenues() {
  const { data } = await api.get<Venue[]>("/venues");
  return data;
}

export async function listEvents() {
  const { data } = await api.get<EventSummary[]>("/events");
  return data;
}

export async function getUpcomingEvent() {
  const { data } = await api.get<EventSummary | null>("/events/upcoming");
  return data;
}

export async function getEvent(id: string) {
  const { data } = await api.get<EventSummary>(`/events/${id}`);
  return data;
}

export async function createEvent(payload: EventPayload) {
  const { data } = await api.post<EventSummary>("/events", payload);
  return data;
}

export async function cancelEvent(id: string, created_by_name: string) {
  const { data } = await api.patch<EventSummary>(`/events/${id}/cancel`, { created_by_name });
  return data;
}

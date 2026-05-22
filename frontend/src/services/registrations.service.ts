import { api } from "../lib/axios";
import type { Registration, RegistrationPayload } from "../types/registration.types";

export async function listRegistrations(eventId: string) {
  const { data } = await api.get<Registration[]>(`/events/${eventId}/registrations`);
  return data;
}

export async function registerForEvent(eventId: string, payload: RegistrationPayload) {
  const { data } = await api.post<Registration>(`/events/${eventId}/registrations`, payload);
  return data;
}

export async function unregister(eventId: string, id: string, display_name: string) {
  await api.delete(`/events/${eventId}/registrations/${id}`, { data: { display_name } });
}

export async function togglePayment(eventId: string, id: string, has_paid: boolean) {
  const { data } = await api.patch<Registration>(`/events/${eventId}/registrations/${id}/payment`, {
    has_paid
  });
  return data;
}

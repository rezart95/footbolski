import { api } from "../lib/axios";
import type { FormationPayload, Team } from "../types/team.types";

export async function getTeams(eventId: string) {
  const { data } = await api.get<Team[] | null>(`/events/${eventId}/teams`);
  return data;
}

export async function generateTeams(eventId: string, created_by_name: string) {
  const { data } = await api.post<Team[]>(`/events/${eventId}/teams/generate`, { created_by_name });
  return data;
}

export async function updateFormation(eventId: string, payload: FormationPayload) {
  const { data } = await api.patch<Team[]>(`/events/${eventId}/teams/formation`, payload);
  return data;
}

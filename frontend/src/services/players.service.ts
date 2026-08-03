import { api } from "../lib/axios";
import type { Player, PlayerContactDetail, PlayerPayload } from "../types/player.types";

export async function listPlayers() {
  const { data } = await api.get<Player[]>("/players");
  return data;
}

export async function createPlayer(payload: PlayerPayload, requestedBy: string) {
  const { data } = await api.post<Player>("/players", { ...payload, requested_by: requestedBy });
  return data;
}

export async function updatePlayer(id: string, payload: PlayerPayload, requestedBy: string) {
  const { data } = await api.put<Player>(`/players/${id}`, { ...payload, requested_by: requestedBy });
  return data;
}

/** Admin-only. `requestedBy` is the session name, re-checked server-side. */
export async function updatePlayerNotes(id: string, notes: string | null, requestedBy: string) {
  const { data } = await api.patch<Player>(`/players/${id}/notes`, { notes, requested_by: requestedBy });
  return data;
}

/** Admin-only. Sends the body on DELETE (matches the event-delete pattern). */
export async function deletePlayer(id: string, requestedBy: string) {
  await api.delete(`/players/${id}`, { data: { requested_by: requestedBy } });
}

/** Admin-only. Carries the actual phone numbers — see `PlayerContactDetail`. */
export async function listPlayerContactDetail(requestedBy: string) {
  const { data } = await api.get<PlayerContactDetail[]>("/players/admin/contact", {
    params: { requested_by: requestedBy }
  });
  return data;
}

/** Admin-only. Pass `null` to clear a number. */
export async function setPlayerPhone(id: string, phoneNumber: string | null, requestedBy: string) {
  const { data } = await api.patch<PlayerContactDetail>(`/players/${id}/phone`, {
    phone_number: phoneNumber,
    requested_by: requestedBy
  });
  return data;
}

export async function uploadPlayerPhoto(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post<{ url: string }>("/uploads/player-photo", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return data;
}

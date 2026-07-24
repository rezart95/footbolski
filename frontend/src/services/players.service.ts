import { api } from "../lib/axios";
import type { Player, PlayerPayload } from "../types/player.types";

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

export async function uploadPlayerPhoto(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post<{ url: string }>("/uploads/player-photo", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return data;
}

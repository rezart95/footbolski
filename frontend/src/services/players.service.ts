import { api } from "../lib/axios";
import type { Player, PlayerPayload } from "../types/player.types";

export async function listPlayers() {
  const { data } = await api.get<Player[]>("/players");
  return data;
}

export async function createPlayer(payload: PlayerPayload) {
  const { data } = await api.post<Player>("/players", payload);
  return data;
}

export async function updatePlayer(id: string, payload: PlayerPayload) {
  const { data } = await api.put<Player>(`/players/${id}`, payload);
  return data;
}

export async function deletePlayer(id: string) {
  await api.delete(`/players/${id}`);
}

export async function uploadPlayerPhoto(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post<{ url: string }>("/uploads/player-photo", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return data;
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createPlayer, deletePlayer, listPlayers, updatePlayer, updatePlayerNotes } from "../services/players.service";
import type { PlayerPayload } from "../types/player.types";

export function usePlayers() {
  return useQuery({ queryKey: ["players"], queryFn: listPlayers });
}

/** Admin-portal mutations: edit scouting notes and delete cards. Both are
 * re-authorised server-side against `player_service.ADMIN_NAMES`. */
export function useAdminPlayerActions() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["players"] });

  return {
    setNotes: useMutation({
      mutationFn: ({ id, notes, requestedBy }: { id: string; notes: string | null; requestedBy: string }) =>
        updatePlayerNotes(id, notes, requestedBy),
      onSuccess: invalidate
    }),
    remove: useMutation({
      mutationFn: ({ id, requestedBy }: { id: string; requestedBy: string }) => deletePlayer(id, requestedBy),
      onSuccess: invalidate
    })
  };
}

export function usePlayerActions() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["players"] });

  return {
    create: useMutation({
      mutationFn: ({ payload, requestedBy }: { payload: PlayerPayload; requestedBy: string }) =>
        createPlayer(payload, requestedBy),
      onSuccess: invalidate
    }),
    update: useMutation({
      mutationFn: ({ id, payload, requestedBy }: { id: string; payload: PlayerPayload; requestedBy: string }) =>
        updatePlayer(id, payload, requestedBy),
      onSuccess: invalidate
    })
  };
}

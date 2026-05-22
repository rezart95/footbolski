import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createPlayer, deletePlayer, listPlayers, updatePlayer } from "../services/players.service";
import type { PlayerPayload } from "../types/player.types";

export function usePlayers() {
  return useQuery({ queryKey: ["players"], queryFn: listPlayers });
}

export function usePlayerActions() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["players"] });

  return {
    create: useMutation({ mutationFn: createPlayer, onSuccess: invalidate }),
    update: useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: PlayerPayload }) => updatePlayer(id, payload),
      onSuccess: invalidate
    }),
    remove: useMutation({ mutationFn: deletePlayer, onSuccess: invalidate })
  };
}

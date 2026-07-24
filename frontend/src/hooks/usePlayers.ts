import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createPlayer, listPlayers, updatePlayer } from "../services/players.service";
import type { PlayerPayload } from "../types/player.types";

export function usePlayers() {
  return useQuery({ queryKey: ["players"], queryFn: listPlayers });
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

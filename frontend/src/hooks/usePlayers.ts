import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPlayer,
  deletePlayer,
  listPlayerContactDetail,
  listPlayers,
  setPlayerPhone,
  updatePlayer,
  updatePlayerNotes
} from "../services/players.service";
import type { PlayerPayload } from "../types/player.types";

export function usePlayers() {
  return useQuery({ queryKey: ["players"], queryFn: listPlayers });
}

/** Admin-portal only: every player's phone number, digits included — the
 * one place in the app this is shown, so the field can be pre-filled like
 * notes rather than always rendering blank. Disabled without a session name
 * since the backend re-checks it against `player_service.ADMIN_NAMES` anyway. */
export function usePlayerContactDetail(requestedBy: string) {
  return useQuery({
    queryKey: ["players", "contact-detail", requestedBy],
    queryFn: () => listPlayerContactDetail(requestedBy),
    enabled: requestedBy.trim().length > 0
  });
}

/** Admin-portal mutations: edit scouting notes, set a phone number, and
 * delete cards. All three are re-authorised server-side against
 * `player_service.ADMIN_NAMES`. */
export function useAdminPlayerActions() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["players"] });

  return {
    setNotes: useMutation({
      mutationFn: ({ id, notes, requestedBy }: { id: string; notes: string | null; requestedBy: string }) =>
        updatePlayerNotes(id, notes, requestedBy),
      onSuccess: invalidate
    }),
    setPhone: useMutation({
      mutationFn: ({ id, phoneNumber, requestedBy }: { id: string; phoneNumber: string | null; requestedBy: string }) =>
        setPlayerPhone(id, phoneNumber, requestedBy),
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

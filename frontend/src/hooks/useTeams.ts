import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { generateTeams, getTeams, updateFormation } from "../services/teams.service";
import type { FormationPayload } from "../types/team.types";

export function useTeams(eventId?: string) {
  return useQuery({
    queryKey: ["teams", eventId],
    queryFn: () => getTeams(eventId ?? ""),
    enabled: Boolean(eventId),
    refetchInterval: 15_000
  });
}

export function useTeamActions(eventId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["teams", eventId] });
    queryClient.invalidateQueries({ queryKey: ["events"] }); // invalidates list + single event
  };

  return {
    generate: useMutation({
      mutationKey: ["generate-teams", eventId],
      mutationFn: (name: string) => generateTeams(eventId, name),
      onSuccess: invalidate,
    }),
    formation: useMutation({ mutationFn: (payload: FormationPayload) => updateFormation(eventId, payload), onSuccess: invalidate }),
  };
}

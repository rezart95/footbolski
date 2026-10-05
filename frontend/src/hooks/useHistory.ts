import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getHistory } from "../services/history.service";
import { togglePayment } from "../services/registrations.service";

/** Your own matches, newest first. Keyed by name because the name is the identity. */
export function useHistory(name: string) {
  return useQuery({
    queryKey: ["history", name.trim().toLowerCase()],
    queryFn: () => getHistory(name),
    enabled: name.trim().length > 0
  });
}

/** Mark one of your past matches paid (or undo it) from the You tab. */
export function useHistoryPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, registrationId, paid }: { eventId: string; registrationId: string; paid: boolean }) =>
      togglePayment(eventId, registrationId, paid),
    onSuccess: (_data, { eventId }) => {
      void queryClient.invalidateQueries({ queryKey: ["history"] });
      void queryClient.invalidateQueries({ queryKey: ["registrations", eventId] });
    }
  });
}

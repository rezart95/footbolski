import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listRegistrations, registerForEvent, togglePayment, unregister } from "../services/registrations.service";

export function useRegistrations(eventId?: string) {
  return useQuery({
    queryKey: ["registrations", eventId],
    queryFn: () => listRegistrations(eventId ?? ""),
    enabled: Boolean(eventId),
    refetchInterval: 15_000
  });
}

export function useRegistrationActions(eventId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["registrations", eventId] });

  return {
    join: useMutation({ mutationFn: (display_name: string) => registerForEvent(eventId, { display_name }), onSuccess: invalidate }),
    leave: useMutation({ mutationFn: ({ id, name }: { id: string; name: string }) => unregister(eventId, id, name), onSuccess: invalidate }),
    payment: useMutation({
      mutationFn: ({ id, paid }: { id: string; paid: boolean }) => togglePayment(eventId, id, paid),
      onSuccess: invalidate
    })
  };
}

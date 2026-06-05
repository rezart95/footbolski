import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cancelEvent, createEvent, deleteEvent, getEvent, getUpcomingEvent, listEvents, listVenues } from "../services/events.service";

export function useVenues() {
  return useQuery({ queryKey: ["venues"], queryFn: listVenues, retry: false });
}

export function useEvents() {
  return useQuery({ queryKey: ["events"], queryFn: listEvents, refetchInterval: 15_000 });
}

export function useUpcomingEvent() {
  return useQuery({ queryKey: ["events", "upcoming"], queryFn: getUpcomingEvent, refetchInterval: 15_000 });
}

export function useEvent(id: string) {
  return useQuery({ queryKey: ["events", id], queryFn: () => getEvent(id), refetchInterval: 15_000 });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEvent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["events"] })
  });
}

export function useCancelEvent(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (createdByName: string) => cancelEvent(id, createdByName),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["events"] })
  });
}

export function useDeleteEvent(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (createdByName: string) => deleteEvent(id, createdByName),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["events"] })
  });
}

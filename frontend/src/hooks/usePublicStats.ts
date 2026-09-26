import { useQuery } from "@tanstack/react-query";
import { getPublicStats } from "../services/stats.service";

/** The numbers only move once a week, so no polling: one fetch per visit. */
export function usePublicStats() {
  return useQuery({
    queryKey: ["stats", "public"],
    queryFn: getPublicStats,
    staleTime: 60 * 60 * 1000
  });
}

import { api } from "../lib/axios";

/** Group-wide counts for the public landing page. Mirrors
 * `backend/app/schemas/stats.py` — totals only, never a name. */
export interface PublicStats {
  matches_played: number;
  matches_cancelled: number;
  spots_filled: number;
  spots_paid: number;
  team_splits: number;
  first_match_on: string | null;
}

export async function getPublicStats() {
  const { data } = await api.get<PublicStats>("/stats/public");
  return data;
}

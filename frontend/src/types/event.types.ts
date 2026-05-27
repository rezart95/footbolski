export type EventStatus = "upcoming" | "cancelled" | "completed";

export interface Venue {
  id: string;
  name: "Parkowa Sport" | "Fame Sport" | string;
  address: string | null;
  default_day: number | null;
  default_time: string | null;
  players_per_side: number;
  max_players: number;
}

export interface SwapOption {
  swap: string;
  reason: string;
}

export interface EventSummary {
  id: string;
  venue: Venue;
  event_date: string;
  event_time: string;
  max_players: number;
  created_by_name: string;
  status: EventStatus;
  teams_generated: boolean;
  confirmed_count: number;
  waitlist_count: number;
  ai_reasoning: string | null;
  ai_swap_options: SwapOption[] | null;
}

export interface EventPayload {
  venue_id: string;
  event_date: string;
  event_time: string;
  max_players: number;
  created_by_name: string;
}

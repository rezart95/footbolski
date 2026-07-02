export type EventStatus = "upcoming" | "cancelled" | "completed";

export type PaymentMethod = "blik" | "revolut" | "bank_transfer";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  blik: "BLIK",
  revolut: "Revolut",
  bank_transfer: "Bank Transfer",
};

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
  price_per_person: number | null;
  pay_to_name: string | null;
  payment_method: PaymentMethod | null;
}

export interface EventPayload {
  venue_id: string;
  event_date: string;
  event_time: string;
  max_players: number;
  created_by_name: string;
  price_per_person?: number | null;
  pay_to_name?: string | null;
  payment_method?: PaymentMethod | null;
}

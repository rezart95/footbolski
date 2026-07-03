export type EventStatus = "upcoming" | "cancelled" | "completed";

export type PaymentMethod = "blik" | "revolut" | "bank_transfer";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  blik: "BLIK",
  revolut: "Revolut",
  bank_transfer: "Bank Transfer",
};

// Label + placeholder for the "where to send the payment" field, per method.
export const PAYMENT_HANDLE_LABEL: Record<PaymentMethod, string> = {
  blik: "BLIK phone number",
  revolut: "Revolut username",
  bank_transfer: "Account number / IBAN",
};

export const PAYMENT_HANDLE_PLACEHOLDER: Record<PaymentMethod, string> = {
  blik: "+48 500 000 000",
  revolut: "@username",
  bank_transfer: "PL00 0000 0000 0000",
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
  payment_details: string | null;
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
  payment_details?: string | null;
}

import { api } from "../lib/axios";
import type { EventStatus, PaymentMethod } from "../types/event.types";
import type { RegistrationStatus } from "../types/registration.types";

/** One match a person signed up for. Mirrors `backend/app/schemas/history.py`. */
export interface HistoryItem {
  event_id: string;
  event_date: string;
  event_time: string;
  status: EventStatus;
  venue_name: string;
  registration_id: string;
  list_status: RegistrationStatus;
  position: number;
  has_paid: boolean;
  price_per_person: number | null;
  pay_to_name: string | null;
  payment_method: PaymentMethod | null;
  payment_details: string | null;
}

export async function getHistory(name: string) {
  const { data } = await api.get<HistoryItem[]>("/players/history", { params: { name } });
  return data;
}

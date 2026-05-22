export type RegistrationStatus = "confirmed" | "waitlist";

export interface Registration {
  id: string;
  event_id: string;
  player_id: string | null;
  display_name: string;
  list_status: RegistrationStatus;
  position: number;
  has_paid: boolean;
  paid_at: string | null;
  registered_at: string;
}

export interface RegistrationPayload {
  display_name: string;
}

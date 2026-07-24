import { api } from "../lib/axios";

export type ReminderChannel = "push" | "whatsapp";

export interface ReminderResult {
  channel: ReminderChannel;
  status: "sent" | "failed" | "skipped";
  detail?: string | null;
  messages_sent_count?: number | null;
  messages_remaining?: number | null;
}

export async function sendReminder(
  eventId: string,
  registrationId: string,
  channel: ReminderChannel,
  createdByName: string,
) {
  const { data } = await api.post<ReminderResult>(
    `/events/${eventId}/registrations/${registrationId}/remind`,
    { channel, created_by_name: createdByName },
  );
  return data;
}

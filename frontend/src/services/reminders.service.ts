import { api } from "../lib/axios";

export type ReminderChannel = "push" | "sms";

export interface ReminderResult {
  channel: ReminderChannel;
  status: "sent" | "failed" | "skipped";
  detail?: string | null;
  sms_sent_count?: number | null;
  sms_remaining?: number | null;
}

export async function sendReminder(eventId: string, registrationId: string, channel: ReminderChannel) {
  const { data } = await api.post<ReminderResult>(
    `/events/${eventId}/registrations/${registrationId}/remind`,
    { channel },
  );
  return data;
}

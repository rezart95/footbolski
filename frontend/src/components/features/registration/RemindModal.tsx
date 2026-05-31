import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Bell, MessageSquare } from "lucide-react";
import { Modal } from "../../ui/Modal";
import { Notice } from "../../ui/Notice";
import { errorMessage } from "../../../lib/errors";
import { sendReminder, type ReminderChannel, type ReminderResult } from "../../../services/reminders.service";

interface RemindModalProps {
  open: boolean;
  eventId: string;
  registrationId: string | null;
  displayName: string;
  onClose: () => void;
}

export function RemindModal({ open, eventId, registrationId, displayName, onClose }: RemindModalProps) {
  const [result, setResult] = useState<ReminderResult | null>(null);

  const mutation = useMutation({
    mutationFn: (channel: ReminderChannel) => {
      if (!registrationId) throw new Error("No registration selected");
      return sendReminder(eventId, registrationId, channel);
    },
    onSuccess: (data) => setResult(data),
  });

  const handleClose = () => {
    setResult(null);
    mutation.reset();
    onClose();
  };

  const trigger = (channel: ReminderChannel) => {
    setResult(null);
    mutation.mutate(channel);
  };

  return (
    <Modal open={open} title={`Remind ${displayName}`} onClose={handleClose}>
      <div className="grid gap-3">
        <p className="text-sm text-white/65">Choose how to send the payment reminder.</p>

        <button
          className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-4 text-left transition hover:bg-white/[0.08] disabled:opacity-50"
          disabled={mutation.isPending}
          onClick={() => trigger("push")}
          type="button"
        >
          <Bell className="shrink-0 text-pitch-400" size={20} />
          <div>
            <p className="font-bold">Push notification</p>
            <p className="text-xs text-white/55">Free. Requires the player to have opened the app at least once.</p>
          </div>
        </button>

        <button
          className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-4 text-left transition hover:bg-white/[0.08] disabled:opacity-50"
          disabled={mutation.isPending}
          onClick={() => trigger("sms")}
          type="button"
        >
          <MessageSquare className="shrink-0 text-amber-300" size={20} />
          <div>
            <p className="font-bold">SMS</p>
            <p className="text-xs text-white/55">Max 2 SMS per player per event.</p>
          </div>
        </button>

        {mutation.isPending ? <p className="text-sm text-white/55">Sending…</p> : null}
        {mutation.isError ? (
          <Notice tone="error">{errorMessage(mutation.error, "Failed to send reminder.")}</Notice>
        ) : null}
        {result ? (
          <Notice tone="success">
            {result.detail || "Reminder sent."}
            {result.channel === "sms" && typeof result.sms_remaining === "number"
              ? ` (${result.sms_remaining} SMS left for this event)`
              : ""}
          </Notice>
        ) : null}
      </div>
    </Modal>
  );
}

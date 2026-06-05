import { useState } from "react";
import { PaymentToggle } from "../payment/PaymentToggle";
import { RemindButton } from "./RemindButton";
import { RemindModal } from "./RemindModal";
import { cn } from "../../../lib/utils";
import type { Registration } from "../../../types/registration.types";

interface RegistrationListProps {
  registrations: Registration[];
  onTogglePaid: (registration: Registration) => void;
  maxPlayers?: number;
  busy?: boolean;
  eventId?: string;
}

export function RegistrationList({ registrations, onTogglePaid, maxPlayers, busy, eventId }: RegistrationListProps) {
  const [remindTarget, setRemindTarget] = useState<Registration | null>(null);

  return (
    <section className="surface grid gap-3 rounded-lg p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-xl font-bold">Attending</h2>
        <p className="text-sm text-white/55">
          {registrations.length}{maxPlayers ? ` / ${maxPlayers}` : ""}
        </p>
      </div>
      <div className="grid gap-2">
        {registrations.map((registration) => {
          const canRemind = Boolean(eventId) && !registration.has_paid;
          return (
            <div className="flex items-center gap-3 rounded-lg bg-pitch-950/35 p-2" key={registration.id}>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-white/10 font-mono text-sm font-black text-white/75">{registration.position}</span>
              <p className={cn("min-w-0 flex-1 truncate font-semibold", registration.has_paid ? "text-pitch-400" : "text-white/80")}>
                {registration.display_name}
              </p>
              {canRemind ? (
                <RemindButton disabled={busy} onClick={() => setRemindTarget(registration)} />
              ) : null}
              <PaymentToggle paid={registration.has_paid} disabled={busy} onToggle={() => onTogglePaid(registration)} />
            </div>
          );
        })}
      </div>
      {eventId ? (
        <RemindModal
          displayName={remindTarget?.display_name ?? ""}
          eventId={eventId}
          open={remindTarget !== null}
          registrationId={remindTarget?.id ?? null}
          onClose={() => setRemindTarget(null)}
        />
      ) : null}
    </section>
  );
}

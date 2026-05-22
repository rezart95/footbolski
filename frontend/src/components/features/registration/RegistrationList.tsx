import { PaymentToggle } from "../payment/PaymentToggle";
import { cn } from "../../../lib/utils";
import type { Registration } from "../../../types/registration.types";

interface RegistrationListProps {
  registrations: Registration[];
  onTogglePaid: (registration: Registration) => void;
  maxPlayers?: number;
  busy?: boolean;
}

export function RegistrationList({ registrations, onTogglePaid, maxPlayers, busy }: RegistrationListProps) {
  return (
    <section className="surface grid gap-3 rounded-lg p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-xl font-bold">Attending</h2>
        <p className="text-sm text-white/55">
          {registrations.length}{maxPlayers ? ` / ${maxPlayers}` : ""}
        </p>
      </div>
      <div className="grid gap-2">
        {registrations.map((registration) => (
          <div className="flex items-center gap-3 rounded-lg bg-pitch-950/35 p-2" key={registration.id}>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-white/10 font-mono text-sm font-black text-white/75">{registration.position}</span>
            <p className={cn("min-w-0 flex-1 truncate font-semibold", registration.has_paid ? "text-pitch-400" : "text-white/80")}>
              {registration.display_name}
            </p>
            <PaymentToggle paid={registration.has_paid} disabled={busy} onToggle={() => onTogglePaid(registration)} />
          </div>
        ))}
      </div>
    </section>
  );
}

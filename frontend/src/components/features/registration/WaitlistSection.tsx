import type { Registration } from "../../../types/registration.types";

export function WaitlistSection({ registrations }: { registrations: Registration[] }) {
  if (registrations.length === 0) {
    return null;
  }

  return (
    <section className="surface grid gap-3 rounded-lg p-4">
      <h2 className="font-display text-xl font-bold">Waiting List</h2>
      <div className="grid gap-2">
        {registrations.map((registration) => (
          <div className="flex items-center gap-3 rounded-lg bg-pitch-950/35 p-3 text-white/70" key={registration.id}>
            <span className="font-mono text-sm font-black">{registration.position}</span>
            <p className="truncate font-semibold">{registration.display_name}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

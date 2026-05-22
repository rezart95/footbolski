import { format, parseISO } from "date-fns";
import { MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { EventStatusBadge } from "./EventStatusBadge";
import type { EventSummary } from "../../../types/event.types";

interface EventCardProps {
  event: EventSummary;
  large?: boolean;
}

export function EventCard({ event, large = false }: EventCardProps) {
  const date = parseISO(event.event_date);
  const isCancelled = event.status === "cancelled";

  return (
    <Link
      className="relative block overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] p-4 transition hover:border-pitch-400/40"
      to={`/events/${event.id}`}
    >
      {isCancelled ? <div className="absolute right-4 top-4 rotate-6 border border-white/20 px-2 py-1 text-xs font-black text-white/40">CANCELLED</div> : null}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-white/60">
            <MapPin size={16} />
            {event.venue.name}
          </p>
          <h2 className={large ? "mt-2 font-display text-4xl font-bold" : "mt-1 font-display text-2xl font-bold"}>
            {format(date, "EEEE")}
          </h2>
          <p className="mt-1 text-white/70">
            {format(date, "d MMM yyyy")} at {event.event_time.slice(0, 5)}
          </p>
        </div>
        <EventStatusBadge status={event.status} />
      </div>
      <div className="mt-5 flex items-end justify-between">
        <p className="font-mono text-3xl font-black text-pitch-400">
          {event.confirmed_count}/{event.max_players}
        </p>
        {event.waitlist_count > 0 ? <p className="text-sm text-white/55">{event.waitlist_count} waiting</p> : null}
      </div>
    </Link>
  );
}

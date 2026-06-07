import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Clock, Euro, Info, MapPin, UsersRound } from "lucide-react";
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
  const [showPayInfo, setShowPayInfo] = useState(false);

  // API may return price as string (Decimal serialization) — normalise defensively
  const price = event.price_per_person != null ? Number(event.price_per_person) : null;
  const priceLabel = price != null
    ? `${price % 1 === 0 ? price.toFixed(0) : price.toFixed(2)} zł / person`
    : "After match";

  return (
    <Link className="relative block overflow-hidden rounded-lg border border-white/10 bg-pitch-900/80 p-4 shadow-glow transition hover:border-pitch-400/40" to={`/events/${event.id}`}>
      {isCancelled ? (
        <div className="absolute right-3 top-3 rounded-md border border-red-200/30 bg-red-500/15 px-2.5 py-1 text-xs font-black uppercase text-red-100">
          Cancelled
        </div>
      ) : null}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-white/60">
            <MapPin size={16} />
            {event.venue.name}
          </p>
          <h2 className={large ? "mt-2 font-display text-4xl font-bold" : "mt-1 font-display text-2xl font-bold"}>
            {format(date, "EEEE")}
          </h2>
          <p className="mt-2 flex items-center gap-2 text-sm text-white/65">
            <Clock size={15} />
            {format(date, "d MMM yyyy")} at {event.event_time.slice(0, 5)}
          </p>
        </div>
        {!isCancelled ? <EventStatusBadge status={event.status} /> : null}
      </div>
      <div className="mt-6 flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] p-3">
        <p className="flex items-center gap-2 font-mono text-3xl font-black text-pitch-400">
          <UsersRound size={22} />
          {event.confirmed_count}/{event.max_players}
        </p>
        {event.waitlist_count > 0 ? <p className="text-sm text-white/55">{event.waitlist_count} waiting</p> : null}
      </div>
      {/* Payment row */}
      <div className="mt-3 flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
        <p className="flex items-center gap-2 text-sm font-semibold text-white/80">
          {priceLabel}
        </p>
        {event.pay_to_name ? (
          <button
            className="flex items-center gap-1 rounded-md p-1 text-white/40 transition hover:text-white/80"
            type="button"
            onClick={(e) => { e.preventDefault(); setShowPayInfo((v) => !v); }}
          >
            <Info size={15} />
          </button>
        ) : null}
      </div>
      {showPayInfo && event.pay_to_name ? (
        <div className="mt-2 rounded-lg border border-pitch-400/20 bg-pitch-400/5 px-3 py-2 text-sm text-white/75">
          Pay to <span className="font-bold text-white">{event.pay_to_name}</span>
        </div>
      ) : null}
    </Link>
  );
}

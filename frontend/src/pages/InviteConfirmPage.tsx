import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Check, MapPin, Users } from "lucide-react";
import { LinkLayout } from "../components/layout/LinkLayout";
import { PaymentHandle } from "../components/features/events/PaymentHandle";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import { confirmInvite, getInvite } from "../services/links.service";
import type { InviteResult } from "../services/links.service";
import { mapsUrl } from "../lib/maps";
import { PAYMENT_METHOD_LABELS } from "../types/event.types";
import type { EventSummary } from "../types/event.types";

/** The screen a player lands on after tapping an invite in WhatsApp.
 *
 * Composition is ranked rather than a stack of cards: the answer is large type
 * with no box, details sit under it, a hairline separates the one thing you
 * actually tap (the payment handle), and the lineup is a quiet closing line.
 * Four equal boxes would make the player read all of them to find the answer. */
export function InviteConfirmPage() {
  const { token = "" } = useParams();
  const [result, setResult] = useState<InviteResult | null>(null);
  const [event, setEvent] = useState<EventSummary | null>(null);
  const [spent, setSpent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function claim() {
      try {
        const view = await getInvite(token);
        if (cancelled) return;
        setEvent(view.event);
        setSpent(view.spent);

        // Claiming on load is deliberate: the player already decided by tapping.
        // Asking them to tap again is a second decision they did not ask for.
        const claimed = await confirmInvite(token);
        if (cancelled) return;
        setResult(claimed);
        setEvent(claimed.event);
      } catch {
        if (!cancelled) setError("This link is not valid. It may have been replaced by a newer one.");
      }
    }

    void claim();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (error) {
    return (
      <LinkLayout>
        <h1 className="font-display text-2xl font-bold leading-tight">Link not valid</h1>
        <p className="mt-2 text-sm leading-relaxed text-white/60">{error}</p>
        <Link className="mt-6 inline-block" to="/events">
          <Button>See upcoming games</Button>
        </Link>
      </LinkLayout>
    );
  }

  if (!result || !event) {
    return (
      <LinkLayout>
        <div className="grid gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-9 w-44" />
          <Skeleton className="h-5 w-52" />
          <Skeleton className="mt-4 h-24 w-full rounded-lg" />
        </div>
      </LinkLayout>
    );
  }

  return (
    <LinkLayout>
      <InviteAnswer result={result} spent={spent} event={event} />
    </LinkLayout>
  );
}

function InviteAnswer({
  result,
  spent,
  event
}: {
  result: InviteResult;
  spent: boolean;
  event: EventSummary;
}) {
  const when = new Date(`${event.event_date}T${event.event_time}`);
  const dayLabel = when.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });
  const timeLabel = event.event_time.slice(0, 5);
  const seatsLeft = Math.max(0, event.max_players - event.confirmed_count);

  if (result.outcome === "event_cancelled") {
    return (
      <>
        <h1 className="font-display text-3xl font-bold leading-tight">This game was called off</h1>
        <p className="mt-2 text-sm leading-relaxed text-white/60">
          {dayLabel} at {event.venue.name} is no longer happening.
        </p>
        <Link className="mt-6 inline-block" to="/events">
          <Button>See other games</Button>
        </Link>
      </>
    );
  }

  const waitlisted = result.outcome === "waitlisted";
  const headline = waitlisted
    ? `You're #${result.position} in line`
    : spent && result.outcome === "already_registered"
      ? "You're already in"
      : "You're in";

  return (
    <>
      {/* The anchor. No card: type carries the hierarchy. */}
      {!waitlisted ? (
        <div className="mb-3 grid h-10 w-10 place-items-center rounded-full bg-pitch-400/15 text-pitch-400">
          <Check size={22} strokeWidth={3} />
        </div>
      ) : (
        <div className="mb-3 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white/70">
          <Users size={20} />
        </div>
      )}

      <h1 className="font-display text-3xl font-bold leading-tight">{headline}</h1>

      <p className="mt-2 text-base font-semibold text-white/85">
        {dayLabel} · {timeLabel}
      </p>

      {event.venue.address ? (
        <a
          className="mt-1 inline-flex items-start gap-1.5 text-sm font-semibold leading-snug text-pitch-400"
          href={mapsUrl(event.venue.address)}
          rel="noreferrer"
          target="_blank"
        >
          <MapPin className="mt-0.5 flex-none" size={15} />
          <span>{event.venue.name}</span>
        </a>
      ) : (
        <p className="mt-1 text-sm font-semibold text-white/70">{event.venue.name}</p>
      )}

      {waitlisted ? (
        <p className="mt-4 text-sm leading-relaxed text-white/60">
          The game is full right now. If someone drops out you move up automatically and we'll
          message you straight away.
        </p>
      ) : null}

      {/* Hairline, not another card. */}
      {event.price_per_person || event.payment_details ? (
        <>
          <div className="my-5 h-px bg-white/10" />
          <div className="surface grid gap-3 rounded-lg p-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-wide text-white/50">
                {event.payment_method ? PAYMENT_METHOD_LABELS[event.payment_method] : "Payment"}
              </span>
              {event.price_per_person ? (
                <span className="font-display text-xl font-bold">{event.price_per_person} zł</span>
              ) : null}
            </div>
            {event.payment_method && event.payment_details ? (
              <PaymentHandle method={event.payment_method} value={event.payment_details} />
            ) : null}
            {event.pay_to_name ? (
              <p className="text-xs font-semibold text-white/50">to {event.pay_to_name}</p>
            ) : null}
          </div>
        </>
      ) : null}

      {/* Lineup: names first, because "Flori, Jorge and 6 others" reads as
          momentum where a bare count reads as a warning. */}
      <p className="mt-5 text-sm font-semibold leading-relaxed text-white/55">
        {event.confirmed_count} confirmed
        {seatsLeft > 0 ? ` · ${seatsLeft} ${seatsLeft === 1 ? "spot" : "spots"} left` : " · full"}
      </p>

      <Link className="mt-6 inline-block" to={`/events/${event.id}`}>
        <Button variant="secondary">See who's coming</Button>
      </Link>
    </>
  );
}

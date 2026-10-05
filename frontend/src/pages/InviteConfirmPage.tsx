import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MapPin } from "lucide-react";
import { LinkLayout } from "../components/layout/LinkLayout";
import { PaymentHandle } from "../components/features/events/PaymentHandle";
import { buttonClass } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import { confirmInvite, getInvite } from "../services/links.service";
import type { InviteResult } from "../services/links.service";
import { mapsUrl } from "../lib/maps";
import { PAYMENT_METHOD_LABELS } from "../types/event.types";
import type { EventSummary } from "../types/event.types";

/** The screen a player lands on after tapping an invite in WhatsApp.
 *
 * Composition is ranked rather than a stack of cards: the answer is a poster
 * headline with no box, details sit under it, the money is the one ochre field
 * (holding the handle you actually tap), and the lineup is a quiet closing line.
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
        <h1 className="t-headline text-[3rem] leading-[0.92]">Link not valid</h1>
        <p className="mt-3 text-[17px] leading-relaxed text-fg/80">{error}</p>
        <Link className={buttonClass("primary", "mt-6")} to="/events">
          See upcoming matches
        </Link>
      </LinkLayout>
    );
  }

  if (!result || !event) {
    return (
      <LinkLayout>
        <div aria-busy="true" aria-label="Confirming your place" className="grid gap-3">
          <Skeleton className="h-14 w-56" />
          <Skeleton className="h-5 w-52" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-4 h-32 w-full" />
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
  const price = event.price_per_person != null ? Number(event.price_per_person) : null;

  if (result.outcome === "event_cancelled") {
    return (
      <>
        <h1 className="t-headline text-[3.4rem] uppercase leading-[0.9]">Called off</h1>
        <p className="mt-3 text-[17px] leading-relaxed text-fg/80">
          {dayLabel} at {event.venue.name} is no longer happening.
        </p>
        <Link className={buttonClass("primary", "mt-6")} to="/events">
          See other matches
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
      {/* The answer, set as the poster headline; no card around it. */}
      <h1 className="t-headline text-[3.4rem] uppercase leading-[0.9]">{headline}</h1>

      <p className="mt-4 text-[18px] font-semibold">
        {dayLabel} · {timeLabel}
      </p>

      {event.venue.address ? (
        <a
          className="mt-1 inline-flex items-start gap-1.5 py-1 text-[17px] underline decoration-fg/40 decoration-2 hover:decoration-fg"
          href={mapsUrl(event.venue.address)}
          rel="noreferrer"
          target="_blank"
        >
          <MapPin className="mt-0.5 flex-none" size={18} />
          <span className="font-semibold">{event.venue.name}</span>
        </a>
      ) : (
        <p className="mt-1 text-[17px] font-semibold">{event.venue.name}</p>
      )}

      {waitlisted ? (
        <p className="mt-4 text-[17px] leading-relaxed text-fg/80">
          The match is full right now. If someone drops out you move up automatically and we&rsquo;ll message you
          straight away.
        </p>
      ) : null}

      {/* The one thing to tap: the money, in ochre. */}
      {price || event.payment_details ? (
        <section aria-label="Payment" className="field-money -mx-5 mt-6 grid gap-3 px-5 py-5">
          {price ? <p className="t-numeral text-[3.25rem]">{price % 1 === 0 ? price.toFixed(0) : price.toFixed(2)} zł</p> : null}
          <p className="text-[16px] font-semibold">
            {event.payment_method ? PAYMENT_METHOD_LABELS[event.payment_method] : "Payment"}
            {event.pay_to_name ? (
              <>
                {" "}
                to <span className="font-bold">{event.pay_to_name}</span>
              </>
            ) : null}
          </p>
          {event.payment_method && event.payment_details ? (
            <PaymentHandle method={event.payment_method} value={event.payment_details} />
          ) : null}
        </section>
      ) : null}

      <p className="mt-6 text-[17px] font-semibold tabular-nums">
        {event.confirmed_count} confirmed
        {seatsLeft > 0 ? ` · ${seatsLeft} ${seatsLeft === 1 ? "spot" : "spots"} left` : " · full"}
      </p>

      <Link className={buttonClass("secondary", "mt-4")} to={`/events/${event.id}`}>
        See who&rsquo;s coming
      </Link>
    </>
  );
}

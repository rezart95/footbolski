import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { Check, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { PaymentHandle } from "../components/features/events/PaymentHandle";
import { PlayerPhoto, StatBars } from "../components/features/players/PlayerCard";
import { NameEntryModal } from "../components/features/session/NameEntryModal";
import { buttonClass } from "../components/ui/Button";
import { Notice } from "../components/ui/Notice";
import { Skeleton } from "../components/ui/Skeleton";
import { useHistory, useHistoryPayment } from "../hooks/useHistory";
import { usePlayers } from "../hooks/usePlayers";
import { useSession } from "../hooks/useSession";
import { errorMessage } from "../lib/errors";
import { cn } from "../lib/utils";
import type { HistoryItem } from "../services/history.service";
import { PAYMENT_METHOD_LABELS } from "../types/event.types";

function zl(amount: number) {
  return `${amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2)} zł`;
}

function when(item: HistoryItem) {
  return format(parseISO(item.event_date), "EEE d MMM");
}

/** One past match you still owe for: what, to whom, how, and a way to say
 * you've paid. Sits on the ochre money field, so everything here is ink. */
function OwedRow({ item }: { item: HistoryItem }) {
  const payment = useHistoryPayment();
  return (
    <li className="grid gap-3 border-t-2 border-ink py-4">
      <div className="flex items-baseline justify-between gap-3">
        <Link className="min-w-0 text-[17px] font-bold underline decoration-ink/40 decoration-2 hover:decoration-ink" to={`/events/${item.event_id}`}>
          {when(item)} · {item.venue_name}
        </Link>
        <span className="t-numeral shrink-0 text-[1.75rem]">{item.price_per_person != null ? zl(item.price_per_person) : "TBC"}</span>
      </div>
      {item.pay_to_name || item.payment_method ? (
        <p className="text-[15px]">
          {item.pay_to_name ? (
            <>
              Pay <span className="font-bold">{item.pay_to_name}</span>
            </>
          ) : (
            "Pay"
          )}
          {item.payment_method ? ` by ${PAYMENT_METHOD_LABELS[item.payment_method]}` : ""}
        </p>
      ) : null}
      {item.payment_method && item.payment_details ? (
        <PaymentHandle method={item.payment_method} value={item.payment_details} />
      ) : null}
      <button
        className="tap-target inline-flex items-center justify-center gap-2 self-start bg-ink px-4 text-[15px] font-bold text-paper transition-[background-color,transform] duration-150 hover:bg-ink/85 active:translate-y-px disabled:opacity-40"
        disabled={payment.isPending}
        onClick={() => payment.mutate({ eventId: item.event_id, registrationId: item.registration_id, paid: true })}
        type="button"
      >
        <Check size={17} strokeWidth={3} />
        {payment.isPending ? "Saving…" : "I've paid"}
      </button>
      {payment.isError ? <Notice tone="error">{errorMessage(payment.error, "Could not mark it paid.")}</Notice> : null}
    </li>
  );
}

function statusLine(item: HistoryItem) {
  if (item.status === "cancelled") return "Cancelled";
  if (item.list_status === "waitlist") return item.status === "completed" ? "Waitlist, didn't play" : "On the waitlist";
  if (item.status === "upcoming") return `You're in · No. ${item.position}`;
  return `Played · No. ${item.position}`;
}

/** Where you stand: your season, what you still owe, your card, your matches. */
export function YouPage() {
  const { sessionName } = useSession();
  const { data: players = [] } = usePlayers();
  const { data: history = [], isLoading, isError } = useHistory(sessionName);
  const [editingName, setEditingName] = useState(false);

  const me = sessionName.trim().toLowerCase();
  const myCard = players.find((p) => p.name.trim().toLowerCase() === me);

  const { played, owed, owedTotal, owedUnpriced, next, since } = useMemo(() => {
    const playedItems = history.filter((h) => h.status === "completed" && h.list_status === "confirmed");
    const owedItems = playedItems.filter((h) => !h.has_paid);
    const upcoming = history
      .filter((h) => h.status === "upcoming")
      .sort((a, b) => `${a.event_date}T${a.event_time}`.localeCompare(`${b.event_date}T${b.event_time}`));
    const first = playedItems[playedItems.length - 1];
    return {
      played: playedItems,
      owed: owedItems,
      owedTotal: owedItems.reduce((sum, h) => sum + (h.price_per_person ?? 0), 0),
      owedUnpriced: owedItems.filter((h) => h.price_per_person == null).length,
      next: upcoming[0],
      since: first ? format(parseISO(first.event_date), "MMMM yyyy") : null
    };
  }, [history]);
  const paidCount = played.length - owed.length;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
      {editingName ? <NameEntryModal forceOpen onClose={() => setEditingName(false)} /> : null}

      <header>
        <h1 className="t-headline break-words text-[3rem] leading-[0.9]">{sessionName || "You"}</h1>
        <button
          className="tap-target -ml-1 mt-1 px-1 text-[15px] font-semibold underline decoration-2"
          onClick={() => setEditingName(true)}
          type="button"
        >
          Change name
        </button>
      </header>

      {/* The season, as one sentence rather than a row of stat tiles. */}
      {isLoading ? (
        <div className="grid gap-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-3/4" />
        </div>
      ) : isError ? (
        <Notice tone="error">Can&rsquo;t load your matches right now. Check your connection and try again.</Notice>
      ) : played.length > 0 ? (
        // The season as one sentence (DESIGN.md: a proof sentence, never stat
        // tiles), with its two figures lifted into the poster numeral voice.
        <p className="t-headline max-w-[15ch] text-[2.2rem] leading-[1.02]">
          <span className="t-numeral align-[-0.08em] text-[3.4rem]">{played.length}</span>{" "}
          {played.length === 1 ? "match" : "matches"} played
          {since ? (
            <>
              {" "}since <span className="whitespace-nowrap">{since}.</span>
            </>
          ) : (
            "."
          )}{" "}
          <span className="whitespace-nowrap">
            Paid for <span className="t-numeral align-[-0.08em] text-[3.4rem]">{paidCount}</span>.
          </span>
        </p>
      ) : (
        <p className="t-headline max-w-[16ch] text-[2.4rem] leading-[1.02]">No matches played yet.</p>
      )}

      {next ? (
        <Link
          className="field-inverse -mx-4 flex items-center justify-between gap-3 px-4 py-4"
          to={`/events/${next.event_id}`}
        >
          <span className="min-w-0">
            <span className="t-title block text-[1.5rem]">
              {format(parseISO(next.event_date), "EEEE")} · {next.event_time.slice(0, 5)}
            </span>
            <span className="mt-1 block text-[15px] text-ground/85">{statusLine(next)}</span>
          </span>
          <ChevronRight className="shrink-0" size={24} />
        </Link>
      ) : null}

      {/* Money you still owe: ochre, because it is money. */}
      {!isLoading && played.length > 0 ? (
        <section aria-labelledby="owed-heading" className="field-money -mx-4 px-4 pb-2 pt-6">
          {owed.length > 0 ? (
            <>
              <h2 className="t-title text-[1.35rem]" id="owed-heading">
                You owe
              </h2>
              <p className="t-numeral mt-1 text-[4.5rem]">{zl(owedTotal)}</p>
              <p className="mb-4 mt-1 text-[15px] font-semibold">
                {owed.length} {owed.length === 1 ? "match" : "matches"}
                {owedUnpriced > 0 ? ` · ${owedUnpriced} with the price still to be set` : ""}
              </p>
              <ul>
                {owed.map((item) => (
                  <OwedRow item={item} key={item.registration_id} />
                ))}
              </ul>
            </>
          ) : (
            <div className="pb-4">
              <h2 className="t-headline text-[2.6rem]" id="owed-heading">
                All square.
              </h2>
              <p className="mt-2 text-[16px] font-semibold">Every match you&rsquo;ve played is paid for.</p>
            </div>
          )}
        </section>
      ) : null}

      {/* Your card. */}
      <section aria-labelledby="card-heading">
        <h2 className="t-headline border-b-2 border-fg pb-2 text-[2.1rem]" id="card-heading">
          Your card
        </h2>
        {myCard ? (
          <div className="mt-4 grid gap-5 sm:grid-cols-[12rem_1fr]">
            <div className="flex gap-4 sm:block">
              <PlayerPhoto className="w-32 shrink-0 sm:w-full" player={myCard} />
              <div className="sm:mt-3">
                <p className="t-numeral text-[3.5rem]">{myCard.skill_rating}</p>
                <p className="text-[13px] font-semibold text-fg/75">skill out of 10</p>
                <p className="mt-2 text-[16px] font-bold">{myCard.preferred_role ?? myCard.primary_position}</p>
                <p className="text-[15px] text-fg/75">
                  {[myCard.age ? `${myCard.age} years` : null, myCard.height_cm ? `${myCard.height_cm} cm` : null, myCard.build]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            </div>
            <div>
              <StatBars player={myCard} size="lg" />
              <p className="mt-4 text-[14px] text-fg/75">Ratings are kept by the squad&rsquo;s rating keeper.</p>
            </div>
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            <p className="text-[17px] text-fg/85">You need a card to join matches. It tells the team split where you play and how.</p>
            <Link className={buttonClass("primary", "self-start")} to="/players?create=me">
              Create my card
            </Link>
          </div>
        )}
      </section>

      {/* Every match you signed up for. */}
      {history.length > 0 ? (
        <section aria-labelledby="matches-heading">
          <div className="flex items-end justify-between border-b-2 border-fg pb-2">
            <h2 className="t-headline text-[2.1rem]" id="matches-heading">
              Your matches
            </h2>
            <p className="t-numeral text-[2.1rem]">{history.length}</p>
          </div>
          <ol>
            {history.map((item) => {
              const muted = item.status === "cancelled" || item.list_status === "waitlist";
              return (
                <li key={item.registration_id}>
                  <Link
                    className="flex min-h-[3.75rem] items-center gap-3 border-b border-fg/20 py-2 hover:bg-fg/[0.04]"
                    to={`/events/${item.event_id}`}
                  >
                    <span className="w-[3.25rem] shrink-0">
                      <span className="t-numeral block text-[1.7rem]">{format(parseISO(item.event_date), "dd")}</span>
                      <span className="block text-[12px] font-bold uppercase tracking-wider">
                        {format(parseISO(item.event_date), "MMM")}
                      </span>
                    </span>
                    <span className={cn("min-w-0 flex-1", muted && "text-fg/70")}>
                      <span className="block text-[16px] font-semibold leading-tight">{item.venue_name}</span>
                      <span className="block text-[14px]">{statusLine(item)}</span>
                    </span>
                    {item.status === "completed" && item.list_status === "confirmed" ? (
                      item.has_paid ? (
                        <span className="field-money shrink-0 px-2 py-1 text-[13px] font-bold">Paid</span>
                      ) : (
                        <span className="shrink-0 border-2 border-fg px-2 py-0.5 text-[13px] font-bold">Owed</span>
                      )
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}
    </div>
  );
}

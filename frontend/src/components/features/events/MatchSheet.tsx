import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { Check, MapPin, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AddToCalendar } from "./AddToCalendar";
import { PaymentHandle } from "./PaymentHandle";
import { AIInsightsPanel } from "../teams/AIInsightsPanel";
import { TeamDisplay } from "../teams/TeamDisplay";
import { TeamSplitButton } from "../teams/TeamSplitButton";
import { SplitBall } from "../landing/SplitBall";
import { PaymentToggle } from "../payment/PaymentToggle";
import { RemindButton } from "../registration/RemindButton";
import { RemindModal } from "../registration/RemindModal";
import { RequireCardModal } from "../players/RequireCardModal";
import { Button } from "../../ui/Button";
import { Modal } from "../../ui/Modal";
import { Notice } from "../../ui/Notice";
import { useCancelEvent, useDeleteEvent } from "../../../hooks/useEvents";
import { usePlayers } from "../../../hooks/usePlayers";
import { useRegistrationActions, useRegistrations } from "../../../hooks/useRegistrations";
import { useSession } from "../../../hooks/useSession";
import { useShareEvent } from "../../../hooks/useShareEvent";
import { useTeamActions, useTeams } from "../../../hooks/useTeams";
import { errorMessage } from "../../../lib/errors";
import { mapsUrl, streetAddress } from "../../../lib/maps";
import { cn } from "../../../lib/utils";
import { PAYMENT_METHOD_LABELS, type EventSummary } from "../../../types/event.types";
import type { Registration } from "../../../types/registration.types";

function formatPrice(price: number) {
  return `${price % 1 === 0 ? price.toFixed(0) : price.toFixed(2)} zł`;
}

function ordinal(n: number) {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th"}`;
}

interface Strip {
  title: string;
  detail: string;
  action?: { label: string; onClick: () => void; variant: "inverse" | "inverse-outline" };
}

/** One match, answered first. The ink strip says whether you're in and what you
 * owe; below it the list, the money and the teams, separated by ink rules
 * rather than boxed into cards. Used by Home (next match) and /events/:id. */
export function MatchSheet({ event }: { event: EventSummary }) {
  const navigate = useNavigate();
  const { sessionName } = useSession();
  const { data: registrations = [], isSuccess: registrationsLoaded } = useRegistrations(event.id);
  const { data: teams } = useTeams(event.id);
  const { data: players = [] } = usePlayers();
  const actions = useRegistrationActions(event.id);
  const teamActions = useTeamActions(event.id);
  const cancel = useCancelEvent(event.id);
  const deleteEvent = useDeleteEvent(event.id);
  const { share, copied } = useShareEvent(event);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showRequireCard, setShowRequireCard] = useState(false);
  const [remindTarget, setRemindTarget] = useState<Registration | null>(null);

  const me = sessionName.trim().toLowerCase();
  const mine = useMemo(
    () => registrations.find((r) => r.display_name.toLowerCase() === me),
    [registrations, me]
  );
  const confirmed = registrations.filter((r) => r.list_status === "confirmed");
  const waitlist = registrations.filter((r) => r.list_status === "waitlist");
  const confirmedCount = registrationsLoaded ? confirmed.length : event.confirmed_count;
  const paidCount = confirmed.filter((r) => r.has_paid).length;

  const creatorName = event.created_by_name.toLowerCase();
  const isCreator = me === creatorName || me === creatorName.split(" ")[0];
  const isUpcoming = event.status === "upcoming";
  const isCompleted = event.status === "completed";
  const isCancelled = event.status === "cancelled";
  const isFull = confirmedCount >= event.max_players;
  const canSplit = isCreator && isUpcoming && isFull && !event.teams_generated;
  // API may serialize Decimal as a string — normalise defensively.
  const price = event.price_per_person != null ? Number(event.price_per_person) : null;
  const busy = actions.join.isPending || actions.leave.isPending;
  const date = parseISO(event.event_date);

  function join() {
    const hasCard = players.some((p) => p.name.toLowerCase() === me);
    if (!hasCard) {
      setShowRequireCard(true);
      return;
    }
    actions.join.mutate(sessionName);
  }

  function leave() {
    if (mine) actions.leave.mutate({ id: mine.id, name: sessionName });
  }

  const strip: Strip = (() => {
    if (isCancelled) return { title: "Cancelled", detail: "This match won't go ahead." };
    if (isCompleted) {
      if (mine?.list_status === "confirmed") {
        const owed = mine.has_paid ? "You've paid." : price != null ? `You owe ${formatPrice(price)}.` : "Not marked paid yet.";
        return { title: "Full time. You played", detail: owed };
      }
      return { title: "Full time", detail: `${confirmedCount} played.` };
    }
    if (mine?.list_status === "confirmed") {
      const owed = mine.has_paid
        ? "Paid. See you there."
        : price != null
          ? `Not paid yet · ${formatPrice(price)}`
          : "Not paid yet";
      return {
        title: `You're in · No. ${mine.position}`,
        detail: owed,
        action: { label: "Leave", onClick: leave, variant: "inverse-outline" }
      };
    }
    if (mine?.list_status === "waitlist") {
      const place = waitlist.findIndex((r) => r.id === mine.id) + 1;
      return {
        title: "You're on the waitlist",
        detail: `${ordinal(Math.max(place, 1))} in line. You move up if someone drops out.`,
        action: { label: "Leave waitlist", onClick: leave, variant: "inverse-outline" }
      };
    }
    if (isFull) {
      return {
        title: "It's full",
        detail: `${waitlist.length} waiting. Join to be ${ordinal(waitlist.length + 1)} in line.`,
        action: { label: "Join waitlist", onClick: join, variant: "inverse" }
      };
    }
    const left = event.max_players - confirmedCount;
    return {
      title: "You're not in yet",
      detail: `${left} ${left === 1 ? "spot" : "spots"} left.`,
      action: { label: "Join", onClick: join, variant: "inverse" }
    };
  })();

  const openSpots = isUpcoming ? Math.max(event.max_players - confirmedCount, 0) : 0;
  const hasMoney = price != null || event.payment_method || event.pay_to_name || event.payment_details;

  return (
    <article className="grid grid-cols-[minmax(0,1fr)] gap-8">
      <RequireCardModal open={showRequireCard} onClose={() => setShowRequireCard(false)} />

      {/* The match itself: day, date, time, venue. */}
      <header>
        <h1 className="t-headline break-words text-[3.4rem] uppercase leading-[0.88]">{format(date, "EEEE")}</h1>
        <div className="mt-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            {/* Date and time wrap as two whole pieces, never leaving a stray separator. */}
            <p className="flex flex-wrap gap-x-3 text-[18px] font-semibold tabular-nums">
              <span className="whitespace-nowrap">{format(date, "dd-MMMM-yyyy")}</span>
              <span className="whitespace-nowrap">{event.event_time.slice(0, 5)}</span>
            </p>
            {event.venue.address ? (
              <a
                className="mt-1 inline-flex items-start gap-1.5 py-1 text-[17px] underline decoration-fg/40 decoration-2 hover:decoration-fg"
                href={mapsUrl(event.venue.address)}
                rel="noopener noreferrer"
                target="_blank"
              >
                <MapPin className="mt-0.5 shrink-0" size={18} />
                <span>
                  <span className="font-semibold">{event.venue.name}</span>
                  {streetAddress(event.venue.address)
                    .split(",")
                    .map((part) => (
                      <span key={part}>
                        , <span className="whitespace-nowrap">{part.trim()}</span>
                      </span>
                    ))}
                </span>
              </a>
            ) : (
              <p className="mt-1 text-[17px] font-semibold">{event.venue.name}</p>
            )}
          </div>
          <div className="-mr-3 -mt-3 flex shrink-0">
            <Button
              aria-label={copied ? "Link copied" : "Share match"}
              icon={copied ? <Check size={22} /> : <Share2 size={22} />}
              onClick={share}
              variant="ghost"
            />
            <AddToCalendar event={event} />
          </div>
        </div>
      </header>

      {/* You: the answer before anything else. */}
      <section aria-live="polite" className="field-inverse -mx-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-4">
        <div className="min-w-0">
          <p className="t-title text-[1.6rem]">{strip.title}</p>
          <p className="mt-1 text-[16px] font-medium text-ground/85">{strip.detail}</p>
        </div>
        {strip.action ? (
          <Button disabled={busy} onClick={strip.action.onClick} variant={strip.action.variant}>
            {busy ? "Saving…" : strip.action.label}
          </Button>
        ) : null}
      </section>
      {actions.join.isError ? <Notice tone="error">{errorMessage(actions.join.error, "Could not join this match.")}</Notice> : null}
      {actions.leave.isError ? <Notice tone="error">{errorMessage(actions.leave.error, "Could not leave this match.")}</Notice> : null}

      {/* The list. */}
      <section aria-labelledby={`list-${event.id}`}>
        <div className="flex items-end justify-between gap-3 border-b-2 border-fg pb-2">
          <h2 className="t-headline text-[2.1rem]" id={`list-${event.id}`}>
            The list
          </h2>
          <p aria-label={`${confirmedCount} of ${event.max_players} spots taken`} className="t-numeral text-[2.1rem]">
            {confirmedCount}
            <span className="text-fg/55">/{event.max_players}</span>
          </p>
        </div>
        {isCreator && confirmed.some((r) => !r.has_paid) ? (
          <p className="mt-2 text-[15px] text-fg/75">Tap &ldquo;Paid?&rdquo; when someone pays. The bell sends them a reminder.</p>
        ) : null}
        <ol>
          {confirmed.map((registration) => {
            const isMe = registration.display_name.toLowerCase() === me;
            return (
              <li
                className={cn(
                  "flex min-h-[3.75rem] items-center gap-3 border-b border-fg/20 py-1.5",
                  isMe && "field-inverse -mx-2 px-2"
                )}
                key={registration.id}
              >
                <span className="t-numeral w-7 shrink-0 text-center text-[1.4rem]">{registration.position}</span>
                <span className="min-w-0 flex-1 break-words text-[17px] font-semibold leading-tight">
                  {registration.display_name}
                  {isMe ? <span className="ml-2 align-middle text-[12px] font-bold uppercase tracking-wider">You</span> : null}
                </span>
                {isCreator && !registration.has_paid ? (
                  <RemindButton
                    inverse={isMe}
                    disabled={actions.payment.isPending}
                    name={registration.display_name}
                    onClick={() => setRemindTarget(registration)}
                  />
                ) : null}
                <PaymentToggle
                  inverse={isMe}
                  disabled={actions.payment.isPending}
                  name={registration.display_name}
                  paid={registration.has_paid}
                  onToggle={() => actions.payment.mutate({ id: registration.id, paid: !registration.has_paid })}
                />
              </li>
            );
          })}
          {Array.from({ length: openSpots }, (_, i) => (
            <li className="flex min-h-[3.25rem] items-center gap-3 border-b border-fg/20 py-1.5 text-fg/60" key={`open-${i}`}>
              <span className="t-numeral w-7 shrink-0 text-center text-[1.4rem]">{confirmedCount + i + 1}</span>
              <span className="text-[17px] font-medium">Open spot</span>
            </li>
          ))}
        </ol>

        {!isCompleted && waitlist.length > 0 ? (
          <div className="mt-6">
            <h3 className="t-title text-[1.35rem]">Waiting</h3>
            <ol className="mt-1">
              {waitlist.map((registration, i) => (
                <li className="flex min-h-[3.25rem] items-center gap-3 border-b border-fg/20 py-1.5" key={registration.id}>
                  <span className="t-numeral w-7 shrink-0 text-center text-[1.4rem] text-fg/70">{i + 1}</span>
                  <span className="min-w-0 flex-1 break-words text-[17px] font-medium leading-tight text-fg/85">
                    {registration.display_name}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </section>
      {actions.payment.isError ? <Notice tone="error">{errorMessage(actions.payment.error, "Could not update the payment.")}</Notice> : null}

      {/* The money: ochre, because it is money. */}
      {hasMoney ? (
        <section aria-labelledby={`money-${event.id}`} className="field-money poster-ticket -mx-4 px-5 py-6">
          <h2 className="sr-only" id={`money-${event.id}`}>
            Payment
          </h2>
          {price != null ? (
            <p className="t-numeral text-[3.75rem]">{formatPrice(price)}</p>
          ) : (
            <p className="t-headline text-[2rem]">Amount set after the match</p>
          )}
          <p className="mt-1 text-[17px] font-semibold">
            {price != null ? "per person" : null}
            {price != null && event.payment_method ? " · " : null}
            {event.payment_method ? PAYMENT_METHOD_LABELS[event.payment_method] : null}
          </p>
          {event.pay_to_name ? (
            <p className="mt-3 text-[17px]">
              Pay to <span className="font-bold">{event.pay_to_name}</span>
            </p>
          ) : null}
          {event.payment_method && event.payment_details ? (
            <div className="mt-3">
              <PaymentHandle method={event.payment_method} value={event.payment_details} />
            </div>
          ) : null}
          {confirmedCount > 0 && registrationsLoaded ? (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t-2 border-ink pt-3">
              <p className="text-[16px] font-bold tabular-nums">
                {paidCount} of {confirmedCount} paid
              </p>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* The teams: red and blue, once split. */}
      {teams?.length || isUpcoming ? (
        <section aria-labelledby={`teams-${event.id}`}>
          <h2 className="t-headline border-b-2 border-fg pb-2 text-[2.1rem]" id={`teams-${event.id}`}>
            Teams
          </h2>
          {teamActions.generate.isPending ? (
            <div aria-live="polite" className="mt-5 flex items-center gap-4">
              <SplitBall className="w-20 shrink-0" />
              <div>
                <p className="t-title text-[1.35rem]">Splitting the teams…</p>
                <p className="mt-1 text-[15px] text-fg/75">Claude is weighing everyone&rsquo;s card. It takes a few seconds.</p>
              </div>
            </div>
          ) : teams?.length ? (
            <div className="mt-5 grid gap-5">
              <TeamDisplay
                editable={isCreator}
                onUpdateFormation={(payload) => teamActions.formation.mutate(payload)}
                playersPerSide={event.venue.players_per_side}
                teams={teams}
              />
              {event.ai_reasoning ? (
                <AIInsightsPanel reasoning={event.ai_reasoning} swapOptions={event.ai_swap_options} />
              ) : null}
            </div>
          ) : canSplit ? (
            <div className="mt-4 grid gap-4">
              <p className="text-[17px] text-fg/80">All {event.max_players} are in. Split the teams when you&rsquo;re ready.</p>
              <TeamSplitButton
                busy={teamActions.generate.isPending}
                visible
                onGenerate={() => teamActions.generate.mutate(sessionName)}
              />
            </div>
          ) : (
            <p className="mt-3 text-[17px] text-fg/80">
              {isCreator
                ? `You can split the teams once all ${event.max_players} spots are filled.`
                : `Teams are split once all ${event.max_players} spots are filled.`}
            </p>
          )}
          {teamActions.generate.isError ? (
            <div className="mt-4">
              <Notice tone="error">{errorMessage(teamActions.generate.error, "The team split failed. Try again.")}</Notice>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* The organiser's own controls, last and plain. */}
      {isCreator && (isUpcoming || isCancelled) ? (
        <section className="border-t-2 border-fg pt-4">
          <h2 className="t-title text-[1.35rem]">Organiser</h2>
          <p className="mt-1 text-[15px] text-fg/75">You set up this match.</p>
          <div className="mt-3">
            {isUpcoming ? (
              <Button onClick={() => setShowCancelConfirm(true)} variant="danger">
                Cancel match
              </Button>
            ) : (
              <Button
                disabled={deleteEvent.isPending}
                onClick={() => deleteEvent.mutate(sessionName, { onSuccess: () => navigate("/events") })}
                variant="danger"
              >
                {deleteEvent.isPending ? "Deleting…" : "Delete match"}
              </Button>
            )}
          </div>
          {deleteEvent.isError ? (
            <div className="mt-3">
              <Notice tone="error">{errorMessage(deleteEvent.error, "Could not delete the match.")}</Notice>
            </div>
          ) : null}
        </section>
      ) : null}

      <Modal open={showCancelConfirm} title="Cancel this match?" onClose={() => setShowCancelConfirm(false)}>
        <div className="grid gap-4">
          <p className="text-[17px] leading-relaxed text-fg/80">Everyone on the list gets a notification that it&rsquo;s off.</p>
          <div className="flex flex-wrap gap-3">
            <Button
              disabled={cancel.isPending}
              onClick={() => cancel.mutate(sessionName, { onSuccess: () => setShowCancelConfirm(false) })}
            >
              {cancel.isPending ? "Cancelling…" : "Yes, cancel it"}
            </Button>
            <Button onClick={() => setShowCancelConfirm(false)} variant="secondary">
              Keep the match
            </Button>
          </div>
          {cancel.isError ? <Notice tone="error">{errorMessage(cancel.error, "Could not cancel the match.")}</Notice> : null}
        </div>
      </Modal>

      <RemindModal
        displayName={remindTarget?.display_name ?? ""}
        eventId={event.id}
        open={remindTarget !== null}
        registrationId={remindTarget?.id ?? null}
        onClose={() => setRemindTarget(null)}
      />
    </article>
  );
}

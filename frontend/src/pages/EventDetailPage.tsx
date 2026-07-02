import { CheckCircle2, MapPin, TimerOff, Trash2, Wallet } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { AIInsightsPanel } from "../components/features/teams/AIInsightsPanel";
import { TeamDisplay } from "../components/features/teams/TeamDisplay";
import { TeamSplitButton } from "../components/features/teams/TeamSplitButton";
import { JoinButton } from "../components/features/registration/JoinButton";
import { RequireCardModal } from "../components/features/players/RequireCardModal";
import { RegistrationList } from "../components/features/registration/RegistrationList";
import { WaitlistSection } from "../components/features/registration/WaitlistSection";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { Modal } from "../components/ui/Modal";
import { Notice } from "../components/ui/Notice";
import { useCancelEvent, useDeleteEvent, useEvent } from "../hooks/useEvents";
import { useRegistrationActions, useRegistrations } from "../hooks/useRegistrations";
import { useSession } from "../hooks/useSession";
import { useTeamActions, useTeams } from "../hooks/useTeams";
import { usePlayers } from "../hooks/usePlayers";
import { errorMessage } from "../lib/errors";
import { mapsUrl } from "../lib/maps";
import { PAYMENT_METHOD_LABELS } from "../types/event.types";
import { useMemo, useState } from "react";

export function EventDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { sessionName } = useSession();
  const { data: event, isLoading } = useEvent(id);
  const { data: registrations = [] } = useRegistrations(id);
  const { data: teams } = useTeams(id);
  const registrationActions = useRegistrationActions(id);
  const teamActions = useTeamActions(id);
  const cancel = useCancelEvent(id);
  const deleteEvent = useDeleteEvent(id);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showRequireCard, setShowRequireCard] = useState(false);
  const { data: players = [] } = usePlayers();
  const mine = useMemo(
    () => registrations.find((r) => r.display_name.toLowerCase() === sessionName.toLowerCase()),
    [registrations, sessionName]
  );

  if (isLoading) {
    return <EmptyState title="Loading event" />;
  }

  if (!event) {
    return <EmptyState title="Event not found" />;
  }

  const confirmed = registrations.filter((item) => item.list_status === "confirmed");
  const waitlist = registrations.filter((item) => item.list_status === "waitlist");
  const sn = sessionName.toLowerCase();
  const creator = sn === event.created_by_name.toLowerCase() ||
    sn === event.created_by_name.split(" ")[0].toLowerCase();
  const canSplit = creator && event.confirmed_count === event.max_players && !event.teams_generated;
  const teamsGenerated = creator && event.teams_generated;
  const isCompleted = event.status === "completed";
  const isCancelled = event.status === "cancelled";
  // API may serialize Decimal as a string — normalise defensively.
  const price = event.price_per_person != null ? Number(event.price_per_person) : null;

  function leave() {
    if (mine) registrationActions.leave.mutate({ id: mine.id, name: sessionName });
  }

  function tryJoin() {
    const hasCard = players.some((p) => p.name.toLowerCase() === sessionName.toLowerCase());
    if (!hasCard) { setShowRequireCard(true); return; }
    registrationActions.join.mutate(sessionName);
  }

  return (
    <div className="grid gap-5">
      <RequireCardModal open={showRequireCard} onClose={() => setShowRequireCard(false)} />
      <Modal title="Cancel Event" open={showCancelConfirm} onClose={() => setShowCancelConfirm(false)}>
        <div className="grid gap-4">
          <p className="text-white/70">Are you sure you want to cancel this event? All registered players will be notified.</p>
          <div className="flex gap-3">
            <Button
              disabled={cancel.isPending}
              variant="danger"
              onClick={() => cancel.mutate(sessionName, { onSuccess: () => setShowCancelConfirm(false) })}
            >
              {cancel.isPending ? "Cancelling…" : "Yes, Cancel Event"}
            </Button>
            <Button variant="secondary" onClick={() => setShowCancelConfirm(false)}>Keep Event</Button>
          </div>
          {cancel.isError ? <Notice tone="error">{errorMessage(cancel.error, "Could not cancel event.")}</Notice> : null}
        </div>
      </Modal>

      <section className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold">{event.venue.name}</h1>
            <p className="mt-2 text-white/65">
              {event.event_date} at {event.event_time.slice(0, 5)}
            </p>
          </div>
          <div className="flex gap-2">
            {creator && !isCompleted && !isCancelled ? (
              <Button onClick={() => setShowCancelConfirm(true)} variant="danger">Cancel</Button>
            ) : null}
            {creator && isCancelled ? (
              <Button
                disabled={deleteEvent.isPending}
                icon={<Trash2 size={16} />}
                variant="danger"
                onClick={() => deleteEvent.mutate(sessionName, { onSuccess: () => navigate("/events") })}
              >
                {deleteEvent.isPending ? "Deleting…" : "Delete"}
              </Button>
            ) : null}
          </div>
        </div>
        {event.venue.address ? (
          <a
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-pitch-400/30 bg-pitch-400/10 px-3 py-2 text-sm font-bold text-pitch-400 transition hover:bg-pitch-400/20"
            href={mapsUrl(event.venue.address)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MapPin size={16} />
            {event.venue.address}
          </a>
        ) : null}
      </section>

      {(price != null || event.payment_method || event.pay_to_name) ? (
        <section className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <p className="flex items-center gap-2 font-semibold text-white/85">
            <Wallet className="text-pitch-400" size={18} />
            {price != null ? `${price % 1 === 0 ? price.toFixed(0) : price.toFixed(2)} zł / person` : "Amount set after match"}
          </p>
          {event.payment_method ? (
            <span className="rounded-md bg-pitch-400/15 px-2.5 py-1 text-xs font-bold text-pitch-400">
              {PAYMENT_METHOD_LABELS[event.payment_method]}
            </span>
          ) : null}
          {event.pay_to_name ? (
            <span className="text-sm text-white/65">
              Pay to <span className="font-bold text-white">{event.pay_to_name}</span>
            </span>
          ) : null}
        </section>
      ) : null}

      {isCompleted ? (
        <div className="flex items-center gap-3 rounded-lg border border-sky-400/25 bg-sky-400/5 p-4">
          <TimerOff className="shrink-0 text-sky-400" size={20} />
          <div>
            <p className="font-semibold text-sky-300">Match has ended</p>
            {creator ? <p className="text-xs text-white/45">Payment status below — tap a player to mark as paid</p> : null}
          </div>
        </div>
      ) : null}

      {!isCompleted && !isCancelled ? (
        <JoinButton
          busy={registrationActions.join.isPending || registrationActions.leave.isPending}
          event={event}
          registration={mine}
          onJoin={tryJoin}
          onLeave={leave}
        />
      ) : null}
      {registrationActions.join.isError ? <Notice tone="error">{errorMessage(registrationActions.join.error, "Could not join this event.")}</Notice> : null}
      {registrationActions.leave.isError ? <Notice tone="error">{errorMessage(registrationActions.leave.error, "Could not leave this event.")}</Notice> : null}

      <RegistrationList
        busy={registrationActions.payment.isPending}
        eventId={id}
        maxPlayers={event.max_players}
        registrations={confirmed}
        onTogglePaid={(registration) => registrationActions.payment.mutate({ id: registration.id, paid: !registration.has_paid })}
      />
      {!isCompleted ? <WaitlistSection registrations={waitlist} /> : null}
      <TeamSplitButton
        busy={teamActions.generate.isPending}
        visible={canSplit}
        onGenerate={() => teamActions.generate.mutate(sessionName)}
      />
      {teamsGenerated ? (
        <div className="flex items-center gap-3 rounded-lg border border-pitch-400/25 bg-pitch-400/5 p-4">
          <CheckCircle2 className="shrink-0 text-pitch-400" size={20} />
          <p className="text-sm font-semibold text-pitch-400">Teams have been generated for this event</p>
        </div>
      ) : null}
      {teamActions.generate.isError ? (
        <Notice tone="error">
          {errorMessage(teamActions.generate.error, "AI team split failed. Please try again.")}
        </Notice>
      ) : null}
      {teams?.length ? <TeamDisplay editable={creator} playersPerSide={event.venue.players_per_side} teams={teams} /> : null}
      {event.ai_reasoning ? (
        <AIInsightsPanel reasoning={event.ai_reasoning} swapOptions={event.ai_swap_options} />
      ) : null}
    </div>
  );
}

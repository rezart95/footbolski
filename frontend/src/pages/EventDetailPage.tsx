import { CheckCircle2, ExternalLink } from "lucide-react";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AIInsightsPanel } from "../components/features/teams/AIInsightsPanel";
import { TeamDisplay } from "../components/features/teams/TeamDisplay";
import { TeamSplitButton } from "../components/features/teams/TeamSplitButton";
import { RegistrationList } from "../components/features/registration/RegistrationList";
import { WaitlistSection } from "../components/features/registration/WaitlistSection";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { Notice } from "../components/ui/Notice";
import { useCancelEvent, useEvent } from "../hooks/useEvents";
import { useRegistrationActions, useRegistrations } from "../hooks/useRegistrations";
import { useSession } from "../hooks/useSession";
import { useTeamActions, useTeams } from "../hooks/useTeams";
import { errorMessage } from "../lib/errors";

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

  // Redirect to pitch the moment generation starts
  useEffect(() => {
    if (teamActions.generate.isPending) navigate("/pitch");
  }, [teamActions.generate.isPending, navigate]);

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

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold">{event.venue.name}</h1>
            <p className="mt-2 text-white/65">
              {event.event_date} at {event.event_time.slice(0, 5)}
            </p>
          </div>
          {creator ? <Button onClick={() => cancel.mutate(sessionName)} variant="danger">Cancel</Button> : null}
        </div>
        {event.venue.address ? (
          <a className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-pitch-400" href={`https://maps.google.com/?q=${event.venue.address}`}>
            Map <ExternalLink size={15} />
          </a>
        ) : null}
      </section>
      <RegistrationList
        busy={registrationActions.payment.isPending}
        maxPlayers={event.max_players}
        registrations={confirmed}
        onTogglePaid={(registration) => registrationActions.payment.mutate({ id: registration.id, paid: !registration.has_paid })}
      />
      <WaitlistSection registrations={waitlist} />
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

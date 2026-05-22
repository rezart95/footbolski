import { ExternalLink } from "lucide-react";
import { useParams } from "react-router-dom";
import { TeamDisplay } from "../components/features/teams/TeamDisplay";
import { TeamSplitButton } from "../components/features/teams/TeamSplitButton";
import { RegistrationList } from "../components/features/registration/RegistrationList";
import { WaitlistSection } from "../components/features/registration/WaitlistSection";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { useCancelEvent, useEvent } from "../hooks/useEvents";
import { useRegistrationActions, useRegistrations } from "../hooks/useRegistrations";
import { useSession } from "../hooks/useSession";
import { useTeamActions, useTeams } from "../hooks/useTeams";

export function EventDetailPage() {
  const { id = "" } = useParams();
  const { sessionName } = useSession();
  const { data: event, isLoading } = useEvent(id);
  const { data: registrations = [] } = useRegistrations(id);
  const { data: teams } = useTeams(id);
  const registrationActions = useRegistrationActions(id);
  const teamActions = useTeamActions(id);
  const cancel = useCancelEvent(id);

  if (isLoading) {
    return <EmptyState title="Loading event" />;
  }

  if (!event) {
    return <EmptyState title="Event not found" />;
  }

  const confirmed = registrations.filter((item) => item.list_status === "confirmed");
  const waitlist = registrations.filter((item) => item.list_status === "waitlist");
  const creator = sessionName.toLowerCase() === event.created_by_name.toLowerCase();
  const canSplit = creator && event.confirmed_count === event.max_players && !event.teams_generated;

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
      <TeamSplitButton busy={teamActions.generate.isPending} visible={canSplit} onGenerate={() => teamActions.generate.mutate(sessionName)} />
      {teams?.length ? <TeamDisplay editable={creator} playersPerSide={event.venue.players_per_side} teams={teams} /> : null}
    </div>
  );
}

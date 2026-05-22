import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { CreateEventModal } from "../components/features/events/CreateEventModal";
import { EventCard } from "../components/features/events/EventCard";
import { JoinButton } from "../components/features/registration/JoinButton";
import { RegistrationList } from "../components/features/registration/RegistrationList";
import { WaitlistSection } from "../components/features/registration/WaitlistSection";
import { TeamSplitButton } from "../components/features/teams/TeamSplitButton";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { Notice } from "../components/ui/Notice";
import { useEvents, useUpcomingEvent } from "../hooks/useEvents";
import { useRegistrationActions, useRegistrations } from "../hooks/useRegistrations";
import { useSession } from "../hooks/useSession";
import { useTeamActions } from "../hooks/useTeams";
import { errorMessage } from "../lib/errors";

export function HomePage() {
  const [creating, setCreating] = useState(new URLSearchParams(location.search).get("create") === "1");
  const { sessionName } = useSession();
  const upcoming = useUpcomingEvent();
  const events = useEvents();
  const fallbackEvent = events.data
    ?.filter((item) => item.status === "upcoming")
    .sort((a, b) => `${a.event_date}T${a.event_time}`.localeCompare(`${b.event_date}T${b.event_time}`))[0];
  const event = upcoming.data ?? fallbackEvent;
  const { data: registrations = [] } = useRegistrations(event?.id);
  const actions = useRegistrationActions(event?.id ?? "pending");
  const teamActions = useTeamActions(event?.id ?? "pending");

  const confirmed = registrations.filter((item) => item.list_status === "confirmed");
  const waitlist = registrations.filter((item) => item.list_status === "waitlist");
  const mine = useMemo(
    () => registrations.find((item) => item.display_name.toLowerCase() === sessionName.toLowerCase()),
    [registrations, sessionName]
  );
  const creator = event ? sessionName.toLowerCase() === event.created_by_name.toLowerCase() : false;
  const canSplit = creator && !!event && event.confirmed_count === event.max_players && !event.teams_generated;

  function leave() {
    if (mine && event) {
      actions.leave.mutate({ id: mine.id, name: sessionName });
    }
  }

  if (upcoming.isLoading && events.isLoading) {
    return <EmptyState title="Loading the next match" detail="Checking the pitch calendar." />;
  }

  return (
    <div className="grid gap-5">
      {event ? (
        <>
          {upcoming.isError ? <Notice tone="info">Showing the first upcoming event from the events list because the primary upcoming query did not respond.</Notice> : null}
          <EventCard event={event} large />
          {actions.join.isError ? <Notice tone="error">{errorMessage(actions.join.error, "Could not join this event.")}</Notice> : null}
          {actions.leave.isError ? <Notice tone="error">{errorMessage(actions.leave.error, "Could not leave this event.")}</Notice> : null}
          <JoinButton
            busy={actions.join.isPending || actions.leave.isPending}
            event={event}
            registration={mine}
            onJoin={() => actions.join.mutate(sessionName)}
            onLeave={leave}
          />
          <RegistrationList
            busy={actions.payment.isPending}
            maxPlayers={event.max_players}
            registrations={confirmed}
            onTogglePaid={(registration) => actions.payment.mutate({ id: registration.id, paid: !registration.has_paid })}
          />
          <WaitlistSection registrations={waitlist} />
          <TeamSplitButton busy={teamActions.generate.isPending} visible={canSplit} onGenerate={() => teamActions.generate.mutate(sessionName)} />
        </>
      ) : (
        <EmptyState
          title="No upcoming event"
          detail="Only real backend events appear here. Create one once the API is connected."
          action={<Button onClick={() => setCreating(true)}>Create One</Button>}
        />
      )}
      {!event && (upcoming.isError || events.isError) ? <Notice tone="error">Backend is not returning events yet. Check the backend URL and database connection.</Notice> : null}
      <Button className="fixed bottom-28 right-4 z-30 rounded-full shadow-glow" icon={<Plus size={20} />} onClick={() => setCreating(true)}>
        Create
      </Button>
      <CreateEventModal open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}

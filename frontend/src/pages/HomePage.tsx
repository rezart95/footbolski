import { useMemo, useState } from "react";
import { EventCard } from "../components/features/events/EventCard";
import { CreateEventModal } from "../components/features/events/CreateEventModal";
import { JoinButton } from "../components/features/registration/JoinButton";
import { RequireCardModal } from "../components/features/players/RequireCardModal";
import { RegistrationList } from "../components/features/registration/RegistrationList";
import { WaitlistSection } from "../components/features/registration/WaitlistSection";
import { TeamSplitButton } from "../components/features/teams/TeamSplitButton";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { PageHeader } from "../components/ui/PageHeader";
import { EventCardSkeleton } from "../components/ui/Skeleton";
import { Notice } from "../components/ui/Notice";
import { useEvents, useUpcomingEvent } from "../hooks/useEvents";
import { useRegistrationActions, useRegistrations } from "../hooks/useRegistrations";
import { useSession } from "../hooks/useSession";
import { useTeamActions } from "../hooks/useTeams";
import { usePlayers } from "../hooks/usePlayers";
import { errorMessage } from "../lib/errors";

export function HomePage() {
  const { sessionName } = useSession();
  const upcoming = useUpcomingEvent();
  const events = useEvents();
  const [creating, setCreating] = useState(false);
  const [showRequireCard, setShowRequireCard] = useState(false);
  const { data: players = [] } = usePlayers();
  const fallbackEvent = events.data
    ?.filter((item) => {
      if (item.status !== "upcoming") return false;
      const eventDateTime = new Date(`${item.event_date.split("T")[0]}T${item.event_time}`);
      return eventDateTime.getTime() > Date.now() - 90 * 60 * 1000; // allow up to 90 min into match
    })
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
  const creator = event
    ? (() => { const sn = sessionName.toLowerCase(); return sn === event.created_by_name.toLowerCase() || sn === event.created_by_name.split(" ")[0].toLowerCase(); })()
    : false;
  const canSplit = creator && !!event && event.confirmed_count === event.max_players && !event.teams_generated;

  function leave() {
    if (mine && event) {
      actions.leave.mutate({ id: mine.id, name: sessionName });
    }
  }

  function tryJoin() {
    const hasCard = players.some((p) => p.name.toLowerCase() === sessionName.toLowerCase());
    if (!hasCard) { setShowRequireCard(true); return; }
    actions.join.mutate(sessionName);
  }

  if (upcoming.isLoading && events.isLoading) {
    return (
      <div className="grid gap-5">
        <PageHeader title="Next match" />
        <EventCardSkeleton large />
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <PageHeader title="Next match" />
      <RequireCardModal open={showRequireCard} onClose={() => setShowRequireCard(false)} />
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
            onJoin={tryJoin}
            onLeave={leave}
          />
          <RegistrationList
            busy={actions.payment.isPending}
            eventId={event.id}
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
      <CreateEventModal open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}

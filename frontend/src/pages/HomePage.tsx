import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { CreateEventModal } from "../components/features/events/CreateEventModal";
import { EventCard } from "../components/features/events/EventCard";
import { JoinButton } from "../components/features/registration/JoinButton";
import { RegistrationList } from "../components/features/registration/RegistrationList";
import { WaitlistSection } from "../components/features/registration/WaitlistSection";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { useUpcomingEvent } from "../hooks/useEvents";
import { useRegistrationActions, useRegistrations } from "../hooks/useRegistrations";
import { useSession } from "../hooks/useSession";

export function HomePage() {
  const [creating, setCreating] = useState(new URLSearchParams(location.search).get("create") === "1");
  const { sessionName } = useSession();
  const { data: event, isLoading } = useUpcomingEvent();
  const { data: registrations = [] } = useRegistrations(event?.id);
  const actions = useRegistrationActions(event?.id ?? "pending");

  const confirmed = registrations.filter((item) => item.list_status === "confirmed");
  const waitlist = registrations.filter((item) => item.list_status === "waitlist");
  const mine = useMemo(
    () => registrations.find((item) => item.display_name.toLowerCase() === sessionName.toLowerCase()),
    [registrations, sessionName]
  );

  function leave() {
    if (mine && event) {
      actions.leave.mutate({ id: mine.id, name: sessionName });
    }
  }

  if (isLoading) {
    return <EmptyState title="Loading the next match" detail="Checking the pitch calendar." />;
  }

  return (
    <div className="grid gap-5">
      {event ? (
        <>
          <EventCard event={event} large />
          <JoinButton
            busy={actions.join.isPending || actions.leave.isPending}
            event={event}
            registration={mine}
            onJoin={() => actions.join.mutate(sessionName)}
            onLeave={leave}
          />
          <RegistrationList
            busy={actions.payment.isPending}
            registrations={confirmed}
            onTogglePaid={(registration) => actions.payment.mutate({ id: registration.id, paid: !registration.has_paid })}
          />
          <WaitlistSection registrations={waitlist} />
        </>
      ) : (
        <EmptyState
          title="No upcoming event"
          detail="Create the next kickabout and the group can join from here."
          action={<Button onClick={() => setCreating(true)}>Create One</Button>}
        />
      )}
      <Button className="fixed bottom-28 right-4 z-30 rounded-full shadow-glow" icon={<Plus size={20} />} onClick={() => setCreating(true)}>
        Create
      </Button>
      <CreateEventModal open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}

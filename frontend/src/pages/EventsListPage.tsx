import { EventCard } from "../components/features/events/EventCard";
import { EmptyState } from "../components/ui/EmptyState";
import { useEvents } from "../hooks/useEvents";

export function EventsListPage() {
  const { data: events = [], isLoading } = useEvents();

  if (isLoading) {
    return <EmptyState title="Loading events" />;
  }

  if (events.length === 0) {
    return <EmptyState title="No events yet" detail="Created matches will appear here newest first." />;
  }

  return (
    <div className="grid gap-4">
      <h1 className="font-display text-3xl font-bold">Events</h1>
      <div className="grid gap-3">
        {events.map((event) => (
          <EventCard event={event} key={event.id} />
        ))}
      </div>
    </div>
  );
}

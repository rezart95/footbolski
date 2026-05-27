import { useState } from "react";
import { Plus } from "lucide-react";
import { CreateEventModal } from "../components/features/events/CreateEventModal";
import { EventCard } from "../components/features/events/EventCard";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { useEvents } from "../hooks/useEvents";

export function EventsListPage() {
  const { data: events = [], isLoading } = useEvents();
  const [creating, setCreating] = useState(false);

  if (isLoading) {
    return <EmptyState title="Loading events" />;
  }

  return (
    <div className="grid gap-4">
      <h1 className="font-display text-3xl font-bold">Events</h1>
      {events.length === 0 ? (
        <EmptyState title="No events yet" detail="Created matches will appear here newest first." />
      ) : (
        <div className="grid gap-3">
          {events.map((event) => (
            <EventCard event={event} key={event.id} />
          ))}
        </div>
      )}
      <Button
        className="fixed bottom-28 right-4 z-30 rounded-full shadow-glow"
        icon={<Plus size={20} />}
        onClick={() => setCreating(true)}
      >
        Create
      </Button>
      <CreateEventModal open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}

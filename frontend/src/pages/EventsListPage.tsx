import { useState } from "react";
import { Plus } from "lucide-react";
import { CreateEventModal } from "../components/features/events/CreateEventModal";
import { EventCard } from "../components/features/events/EventCard";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { PageHeader } from "../components/ui/PageHeader";
import { EventCardSkeletonList } from "../components/ui/Skeleton";
import { useEvents } from "../hooks/useEvents";

export function EventsListPage() {
  const { data: events = [], isLoading } = useEvents();
  const [creating, setCreating] = useState(false);

  return (
    <div className="grid gap-4">
      <PageHeader
        title="Events"
        action={
          <Button className="px-3" icon={<Plus size={18} />} onClick={() => setCreating(true)}>
            Create
          </Button>
        }
      />
      {isLoading ? (
        <EventCardSkeletonList />
      ) : events.length === 0 ? (
        <EmptyState title="No events yet" detail="Created matches will appear here newest first." />
      ) : (
        <div className="grid gap-3">
          {events.map((event) => (
            <EventCard event={event} key={event.id} />
          ))}
        </div>
      )}
      <CreateEventModal open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}

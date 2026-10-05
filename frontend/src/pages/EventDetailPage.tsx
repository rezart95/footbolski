import { Link, useParams } from "react-router-dom";
import { MatchSheet } from "../components/features/events/MatchSheet";
import { buttonClass } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { MatchSheetSkeleton } from "../components/ui/Skeleton";
import { useEvent } from "../hooks/useEvents";

export function EventDetailPage() {
  const { id = "" } = useParams();
  const { data: event, isLoading } = useEvent(id);

  if (isLoading) {
    return <MatchSheetSkeleton />;
  }

  if (!event) {
    return (
      <EmptyState
        action={
          <Link className={buttonClass()} to="/events">
            See all matches
          </Link>
        }
        detail="It may have been deleted by the organiser, or the link is incomplete."
        title="Match not found"
      />
    );
  }

  return <MatchSheet event={event} />;
}

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MatchSheet } from "../components/features/events/MatchSheet";
import { CreateEventModal } from "../components/features/events/CreateEventModal";
import { SplitBall } from "../components/features/landing/SplitBall";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { MatchSheetSkeleton } from "../components/ui/Skeleton";
import { Notice } from "../components/ui/Notice";
import { useEvents, useUpcomingEvent } from "../hooks/useEvents";

/** The member's home: the next match, as a match sheet. */
export function HomePage() {
  const upcoming = useUpcomingEvent();
  const events = useEvents();
  const [searchParams, setSearchParams] = useSearchParams();
  const [creating, setCreating] = useState(false);

  // `/events/new` redirects here with ?create=1.
  useEffect(() => {
    if (searchParams.get("create") === "1") {
      setCreating(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const fallbackEvent = events.data
    ?.filter((item) => {
      if (item.status !== "upcoming") return false;
      const eventDateTime = new Date(`${item.event_date.split("T")[0]}T${item.event_time}`);
      return eventDateTime.getTime() > Date.now() - 90 * 60 * 1000; // allow up to 90 min into match
    })
    .sort((a, b) => `${a.event_date}T${a.event_time}`.localeCompare(`${b.event_date}T${b.event_time}`))[0];
  const event = upcoming.data ?? fallbackEvent;

  if (upcoming.isLoading && events.isLoading) {
    return <MatchSheetSkeleton />;
  }

  return (
    <>
      {event ? (
        <MatchSheet event={event} />
      ) : (
        <div className="grid gap-4">
          <EmptyState
            action={<Button onClick={() => setCreating(true)}>Set up a match</Button>}
            art={<SplitBall className="w-32" still />}
            detail="Set up the next game and everyone gets a notification to join."
            title="No match on the calendar"
          />
          {upcoming.isError || events.isError ? (
            <Notice tone="error">Can&rsquo;t reach the server right now. Check your connection and try again.</Notice>
          ) : null}
        </div>
      )}
      <CreateEventModal open={creating} onClose={() => setCreating(false)} />
    </>
  );
}

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { ChevronRight, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { CreateEventModal } from "../components/features/events/CreateEventModal";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { Notice } from "../components/ui/Notice";
import { PageHeader } from "../components/ui/PageHeader";
import { EventCardSkeletonList } from "../components/ui/Skeleton";
import { useEvents } from "../hooks/useEvents";
import { cn } from "../lib/utils";
import type { EventSummary } from "../types/event.types";

const at = (e: EventSummary) => `${e.event_date.split("T")[0]}T${e.event_time}`;

/** One fixture: a date block (day numeral over the month) and the facts. */
function Fixture({ event, big = false }: { event: EventSummary; big?: boolean }) {
  const date = parseISO(event.event_date);
  const cancelled = event.status === "cancelled";
  const full = event.confirmed_count >= event.max_players;
  return (
    <li>
      <Link
        className={cn(
          "flex items-center gap-4 border-b border-fg/20 hover:bg-fg/[0.04]",
          big ? "min-h-[8rem] py-5" : "min-h-[4rem] py-2"
        )}
        to={`/events/${event.id}`}
      >
        <span className={cn("shrink-0 text-center", big ? "w-[6.5rem]" : "w-[3.25rem]")}>
          <span className={cn("t-numeral block", big ? "text-[5.5rem] leading-[0.85]" : "text-[1.9rem]", cancelled && "line-through decoration-[3px]")}>
            {format(date, "dd")}
          </span>
          <span className={cn("block font-bold uppercase tracking-wider", big ? "t-title text-[1.4rem]" : "text-[12px]")}>
            {format(date, "MMM")}
          </span>
        </span>
        <span className={cn("min-w-0 flex-1", cancelled && "text-fg/70")}>
          <span className={cn("block font-bold leading-tight", big ? "t-title text-[1.5rem]" : "text-[16px]")}>
            {format(date, "EEEE")} · {event.event_time.slice(0, 5)}
          </span>
          <span className="block text-[15px]">{event.venue.name}</span>
          <span className="mt-0.5 block text-[14px] font-semibold tabular-nums">
            {cancelled
              ? "Cancelled"
              : event.status === "completed"
                ? `${event.confirmed_count} played${event.teams_generated ? " · teams split" : ""}`
                : `${event.confirmed_count}/${event.max_players} in${event.waitlist_count ? ` · ${event.waitlist_count} waiting` : full ? " · full" : ""}`}
          </span>
        </span>
        <ChevronRight className="shrink-0" size={22} />
      </Link>
    </li>
  );
}

/** The fixture list: what's next, set large, then everything played, by month. */
export function EventsListPage() {
  const { data: events = [], isLoading, isError } = useEvents();
  const [creating, setCreating] = useState(false);

  const { upcoming, months, playedCount, firstMonth } = useMemo(() => {
    const next = events.filter((e) => e.status === "upcoming").sort((a, b) => at(a).localeCompare(at(b)));
    const past = events.filter((e) => e.status !== "upcoming").sort((a, b) => at(b).localeCompare(at(a)));
    const grouped = new Map<string, EventSummary[]>();
    for (const e of past) {
      const key = format(parseISO(e.event_date), "MMMM yyyy");
      grouped.set(key, [...(grouped.get(key) ?? []), e]);
    }
    const played = past.filter((e) => e.status === "completed");
    const earliest = played[played.length - 1];
    return {
      upcoming: next,
      months: [...grouped.entries()],
      playedCount: played.length,
      firstMonth: earliest ? format(parseISO(earliest.event_date), "MMMM yyyy") : null
    };
  }, [events]);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
      <PageHeader
        title="Matches"
        action={
          <Button icon={<Plus size={18} />} onClick={() => setCreating(true)}>
            Set up
          </Button>
        }
      />

      {isLoading ? <EventCardSkeletonList /> : null}
      {isError ? <Notice tone="error">Can&rsquo;t load the matches right now. Check your connection and try again.</Notice> : null}

      {!isLoading && events.length === 0 && !isError ? (
        <EmptyState
          action={<Button onClick={() => setCreating(true)}>Set up a match</Button>}
          detail="Every match you set up lands here, next ones first."
          title="No matches yet"
        />
      ) : null}

      {!isLoading && events.length > 0 ? (
        <>
          <section aria-labelledby="next-heading">
            <h2 className="t-title text-[1.35rem]" id="next-heading">
              Next
            </h2>
            {upcoming.length > 0 ? (
              <ul className="border-t-2 border-fg">
                {upcoming.map((event) => (
                  <Fixture big event={event} key={event.id} />
                ))}
              </ul>
            ) : (
              <p className="mt-2 border-t-2 border-fg pt-3 text-[17px] text-fg/80">
                Nothing on the calendar.{" "}
                <button className="font-semibold underline decoration-2" onClick={() => setCreating(true)} type="button">
                  Set up the next match
                </button>
                .
              </p>
            )}
          </section>

          {months.length > 0 ? (
            <section aria-labelledby="played-heading">
              <h2 className="t-headline border-b-2 border-fg pb-2 text-[2.1rem]" id="played-heading">
                Played
              </h2>
              {playedCount > 0 ? (
                <p className="mt-3 text-[17px] text-fg/80">
                  <span className="font-bold tabular-nums text-fg">{playedCount}</span> {playedCount === 1 ? "match" : "matches"}
                  {firstMonth ? ` since ${firstMonth}` : ""}.
                </p>
              ) : null}
              <div className="mt-2 grid gap-6">
                {months.map(([month, list]) => (
                  <div key={month}>
                    <h3 className="text-[14px] font-bold uppercase tracking-wider text-fg/80">{month}</h3>
                    <ul className="mt-1 border-t border-fg/40">
                      {list.map((event) => (
                        <Fixture event={event} key={event.id} />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : null}

      <CreateEventModal open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}

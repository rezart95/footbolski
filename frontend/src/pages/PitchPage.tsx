import { useEffect, useState } from "react";
import { DraggablePitch } from "../components/features/formation/DraggablePitch";
import { EmptyState } from "../components/ui/EmptyState";
import { useEvents } from "../hooks/useEvents";
import { useSession } from "../hooks/useSession";
import { useTeamActions, useTeams } from "../hooks/useTeams";
import type { EventSummary } from "../types/event.types";

export function PitchPage() {
  const { data: events = [] } = useEvents();
  const { sessionName } = useSession();

  const splitEvents = (events as EventSummary[]).filter((e) => e.teams_generated);

  const [selectedId, setSelectedId] = useState<string>("");

  useEffect(() => {
    if (!selectedId && splitEvents.length > 0) {
      setSelectedId(splitEvents[0].id);
    }
  }, [splitEvents.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedEvent = splitEvents.find((e) => e.id === selectedId);
  const { data: teams } = useTeams(selectedId);
  const teamActions = useTeamActions(selectedId);

  const editable =
    !!selectedEvent &&
    sessionName.trim().length > 0 &&
    selectedEvent.created_by_name.toLowerCase() === sessionName.toLowerCase();

  if (splitEvents.length === 0) {
    return (
      <EmptyState
        description="Generate a team split from an event to see the pitch."
        title="No teams yet"
      />
    );
  }

  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Pitch</h1>
        {splitEvents.length > 1 && (
          <select
            className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-semibold text-white focus:outline-none"
            onChange={(e) => setSelectedId(e.target.value)}
            value={selectedId}
          >
            {splitEvents.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.venue.name} — {ev.event_date}
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedEvent && teams && teams.length >= 2 ? (
        <DraggablePitch
          editable={editable}
          onUpdate={(payload) => teamActions.formation.mutate(payload)}
          playersPerSide={selectedEvent.venue.players_per_side}
          teams={teams}
        />
      ) : (
        <EmptyState description="Loading teams…" title="" />
      )}
    </div>
  );
}

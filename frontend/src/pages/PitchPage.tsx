import { useIsMutating } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { DraggablePitch } from "../components/features/formation/DraggablePitch";
import { AIInsightsPanel } from "../components/features/teams/AIInsightsPanel";
import { EmptyState } from "../components/ui/EmptyState";
import { PageHeader } from "../components/ui/PageHeader";
import { useEvents } from "../hooks/useEvents";
import { useSession } from "../hooks/useSession";
import { useTeamActions, useTeams } from "../hooks/useTeams";
import type { EventSummary } from "../types/event.types";

export function PitchPage() {
  const { data: events = [] } = useEvents();
  const { sessionName } = useSession();
  const isGenerating = useIsMutating({ mutationKey: ["generate-teams"] }) > 0;

  const splitEvents = (events as EventSummary[]).filter(
    (e) => e.teams_generated && e.status === "upcoming",
  );

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
    (() => { const sn = sessionName.toLowerCase(); return sn === selectedEvent.created_by_name.toLowerCase() || sn === selectedEvent.created_by_name.split(" ")[0].toLowerCase(); })();

  if (splitEvents.length === 0) {
    if (isGenerating) {
      return (
        <div className="grid gap-5">
          <PageHeader title="Pitch" />
          <div className="flex items-center gap-3 rounded-lg border border-pitch-400/30 bg-pitch-400/5 p-4">
            <Loader2 className="shrink-0 animate-spin text-pitch-400" size={22} />
            <div className="min-w-0">
              <p className="font-display font-bold text-pitch-400">AI is splitting teams…</p>
              <p className="text-xs text-white/55">Claude is analysing player ratings — this takes a few seconds</p>
            </div>
          </div>
        </div>
      );
    }
    return (
      <EmptyState
        detail="The organiser hasn't split the teams yet. Check back closer to match day."
        title="Waiting for the next split"
      />
    );
  }

  return (
    <div className="grid gap-5">
      <PageHeader
        title="Pitch"
        action={
          splitEvents.length > 1 ? (
            <select
              className="max-w-[11rem] truncate rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-semibold text-white focus:outline-none"
              onChange={(e) => setSelectedId(e.target.value)}
              value={selectedId}
            >
              {splitEvents.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.venue.name} — {ev.event_date}
                </option>
              ))}
            </select>
          ) : undefined
        }
      />

      {isGenerating ? (
        <div className="flex items-center gap-3 rounded-lg border border-pitch-400/30 bg-pitch-400/5 p-4">
          <Loader2 className="shrink-0 animate-spin text-pitch-400" size={22} />
          <div className="min-w-0">
            <p className="font-display font-bold text-pitch-400">AI is splitting teams…</p>
            <p className="text-xs text-white/55">Claude is analysing player ratings — this takes a few seconds</p>
          </div>
        </div>
      ) : null}

      {selectedEvent && teams && teams.length >= 2 ? (
        <DraggablePitch
          editable={editable}
          onUpdate={(payload) => teamActions.formation.mutate(payload)}
          playersPerSide={selectedEvent.venue.players_per_side}
          teams={teams}
        />
      ) : null}

      {selectedEvent?.ai_reasoning ? (
        <AIInsightsPanel reasoning={selectedEvent.ai_reasoning} swapOptions={selectedEvent.ai_swap_options} />
      ) : null}
    </div>
  );
}

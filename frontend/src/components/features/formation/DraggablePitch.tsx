import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { useRef, useState } from "react";
import type { FormationPayload, Team, TeamPlayer } from "../../../types/team.types";
import { FormationPicker } from "./FormationPicker";
import { formationsFor, slotsForFormation } from "./formations";

// ── Token ──────────────────────────────────────────────────────────────────────

interface TokenProps {
  id: string;
  player: TeamPlayer;
  teamColor: string;
  screenX: number;
  screenY: number;
  disabled: boolean;
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((s) => s[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function Token({ id, player, teamColor, screenX, screenY, disabled }: TokenProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    disabled,
  });

  const tx = transform?.x ?? 0;
  const ty = transform?.y ?? 0;
  const isGreen = teamColor === "green";
  const firstName = player.display_name.split(" ")[0];

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        position: "absolute",
        left: `${screenX}%`,
        top: `${screenY}%`,
        transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px))`,
        zIndex: isDragging ? 50 : 10,
        touchAction: "none",
        cursor: disabled ? "default" : isDragging ? "grabbing" : "grab",
        transition: isDragging ? "none" : "transform 0.15s ease",
      }}
    >
      <div className="flex select-none flex-col items-center gap-0.5">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-black ring-2 ${
            isDragging ? "scale-110 opacity-90" : ""
          } ${
            isGreen
              ? "bg-pitch-400 text-pitch-950 ring-pitch-950/40"
              : "bg-white text-pitch-950 ring-pitch-700/30"
          }`}
        >
          {initials(player.display_name)}
        </div>
        <span className="max-w-[48px] truncate text-center text-[9px] font-bold leading-none text-white/80 drop-shadow">
          {firstName}
        </span>
      </div>
    </div>
  );
}

// ── DraggablePitch ─────────────────────────────────────────────────────────────

export interface DraggablePitchProps {
  teams: Team[];
  playersPerSide: number;
  editable: boolean;
  onUpdate: (payload: FormationPayload) => void;
}

type PosMap = Record<string, { x: number; y: number }>;

function toScreenY(teamIndex: number, localY: number): number {
  return teamIndex === 0 ? (localY / 100) * 50 : 50 + (localY / 100) * 50;
}

function toLocalY(teamIndex: number, screenY: number): number {
  return teamIndex === 0 ? (screenY / 50) * 100 : ((screenY - 50) / 50) * 100;
}

export function DraggablePitch({ teams, playersPerSide, editable, onUpdate }: DraggablePitchProps) {
  const pitchRef = useRef<HTMLDivElement>(null);

  // Stable order: green (Team A) on top half, white (Team B) on bottom half
  const orderedTeams: Team[] = [
    teams.find((t) => t.color === "green") ?? teams[0],
    teams.find((t) => t.color === "white") ?? teams[1],
  ].filter(Boolean) as Team[];

  const [formations, setFormations] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      orderedTeams.map((t) => [t.id, t.formation ?? formationsFor(playersPerSide)[0]]),
    ),
  );

  const [positions, setPositions] = useState<PosMap>(() => {
    const init: PosMap = {};
    for (const team of orderedTeams) {
      for (const player of team.players) {
        init[`${team.id}::${player.id}`] = {
          x: player.pitch_x ?? 50,
          y: player.pitch_y ?? 50,
        };
      }
    }
    return init;
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  );

  function buildPayload(
    team: Team,
    formation: string,
    newPositions: PosMap,
  ): FormationPayload {
    return {
      team_id: team.id,
      formation,
      players: team.players.map((p) => {
        const pos = newPositions[`${team.id}::${p.id}`] ?? { x: p.pitch_x ?? 50, y: p.pitch_y ?? 50 };
        return { id: p.id, pitch_x: pos.x, pitch_y: pos.y };
      }),
    };
  }

  function applySnap(team: Team, teamIndex: number, formation: string): PosMap {
    const slots = slotsForFormation(formation, teamIndex === 0);
    const next = { ...positions };
    team.players.forEach((p, i) => {
      const slot = slots[i] ?? slots[0];
      next[`${team.id}::${p.id}`] = { x: slot.x, y: slot.y };
    });
    return next;
  }

  function handleFormationChange(team: Team, teamIndex: number, formation: string) {
    setFormations((prev) => ({ ...prev, [team.id]: formation }));
    const next = applySnap(team, teamIndex, formation);
    setPositions(next);
    onUpdate(buildPayload(team, formation, next));
  }

  function handleSnap(team: Team, teamIndex: number) {
    const formation = formations[team.id];
    const next = applySnap(team, teamIndex, formation);
    setPositions(next);
    onUpdate(buildPayload(team, formation, next));
  }

  function handleDragEnd(event: DragEndEvent) {
    if (!editable) return;
    const { active, delta } = event;
    if (!delta) return;

    const activeId = active.id as string;
    const sepIdx = activeId.lastIndexOf("::");
    const teamId = activeId.slice(0, sepIdx);
    const playerId = activeId.slice(sepIdx + 2);

    const teamIndex = orderedTeams.findIndex((t) => t.id === teamId);
    const team = orderedTeams[teamIndex];
    if (!team) return;

    const pitch = pitchRef.current;
    if (!pitch) return;
    const rect = pitch.getBoundingClientRect();

    const key = `${teamId}::${playerId}`;
    const current = positions[key] ?? { x: 50, y: 50 };
    const currentScreenY = toScreenY(teamIndex, current.y);

    const dxPct = (delta.x / rect.width) * 100;
    const dyPct = (delta.y / rect.height) * 100;

    const newX = Math.max(3, Math.min(97, current.x + dxPct));
    const rawScreenY = currentScreenY + dyPct;
    const [minSY, maxSY] = teamIndex === 0 ? [2, 48] : [52, 98];
    const clampedScreenY = Math.max(minSY, Math.min(maxSY, rawScreenY));
    const newLocalY = toLocalY(teamIndex, clampedScreenY);

    const next = { ...positions, [key]: { x: newX, y: newLocalY } };
    setPositions(next);
    onUpdate(buildPayload(team, formations[teamId], next));
  }

  return (
    <div className="grid gap-4">
      {/* Formation pickers */}
      <div className="grid grid-cols-2 gap-4">
        {orderedTeams.map((team, idx) => (
          <div className="grid gap-2" key={team.id}>
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                team.color === "green" ? "text-pitch-400" : "text-white/60"
              }`}
            >
              {team.label}
            </span>
            <FormationPicker
              onChange={(f) => handleFormationChange(team, idx, f)}
              playersPerSide={playersPerSide}
              readOnly={!editable}
              value={formations[team.id]}
            />
            {editable && (
              <button
                className="self-start text-xs text-white/35 underline underline-offset-2 hover:text-white/60"
                onClick={() => handleSnap(team, idx)}
                type="button"
              >
                Snap to formation
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Pitch */}
      <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
        <div
          ref={pitchRef}
          className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-pitch-800"
          style={{ aspectRatio: "2 / 3" }}
        >
          {/* SVG pitch markings */}
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full"
            preserveAspectRatio="none"
            viewBox="0 0 100 150"
          >
            {/* Outer boundary */}
            <rect
              fill="none"
              height="144"
              rx="2"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="0.8"
              width="94"
              x="3"
              y="3"
            />
            {/* Centre line */}
            <line
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="0.8"
              x1="3"
              x2="97"
              y1="75"
              y2="75"
            />
            {/* Centre circle */}
            <circle
              cx="50"
              cy="75"
              fill="none"
              r="12"
              stroke="rgba(255,255,255,0.13)"
              strokeWidth="0.8"
            />
            <circle cx="50" cy="75" fill="rgba(255,255,255,0.25)" r="1" />
            {/* Top penalty box */}
            <rect
              fill="none"
              height="22"
              stroke="rgba(255,255,255,0.13)"
              strokeWidth="0.7"
              width="50"
              x="25"
              y="3"
            />
            {/* Top 6-yard box */}
            <rect
              fill="none"
              height="10"
              stroke="rgba(255,255,255,0.10)"
              strokeWidth="0.6"
              width="28"
              x="36"
              y="3"
            />
            {/* Bottom penalty box */}
            <rect
              fill="none"
              height="22"
              stroke="rgba(255,255,255,0.13)"
              strokeWidth="0.7"
              width="50"
              x="25"
              y="125"
            />
            {/* Bottom 6-yard box */}
            <rect
              fill="none"
              height="10"
              stroke="rgba(255,255,255,0.10)"
              strokeWidth="0.6"
              width="28"
              x="36"
              y="137"
            />
          </svg>

          {/* Team half labels */}
          <span className="pointer-events-none absolute left-2 top-2 text-[9px] font-bold uppercase tracking-widest text-pitch-400/50">
            {orderedTeams[0]?.label}
          </span>
          <span className="pointer-events-none absolute bottom-2 left-2 text-[9px] font-bold uppercase tracking-widest text-white/30">
            {orderedTeams[1]?.label}
          </span>

          {/* Player tokens */}
          {orderedTeams.map((team, teamIndex) =>
            team.players.map((player) => {
              const key = `${team.id}::${player.id}`;
              const pos = positions[key] ?? { x: player.pitch_x ?? 50, y: player.pitch_y ?? 50 };
              return (
                <Token
                  disabled={!editable}
                  id={key}
                  key={key}
                  player={player}
                  screenX={pos.x}
                  screenY={toScreenY(teamIndex, pos.y)}
                  teamColor={team.color}
                />
              );
            }),
          )}
        </div>
      </DndContext>
    </div>
  );
}

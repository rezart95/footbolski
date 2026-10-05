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
  /** 0 = the red side (top half), 1 = the blue side (bottom half). */
  side: number;
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

function Token({ id, player, side, screenX, screenY, disabled }: TokenProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    disabled,
  });

  const tx = transform?.x ?? 0;
  const ty = transform?.y ?? 0;
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
          className={`flex h-10 w-10 items-center justify-center rounded-full border-2 border-ground text-[12px] font-bold text-paper transition-transform duration-150 ${
            isDragging ? "scale-110" : ""
          } ${side === 0 ? "bg-poster-red" : "bg-poster-blue"}`}
        >
          {initials(player.display_name)}
        </div>
        <span className="max-w-[64px] truncate bg-ground px-1 text-center text-[11px] font-bold leading-tight text-fg">
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

// Tokens are 40px discs with a name label under them; keep the whole of both
// inside the frame, whatever position was stored (older line-ups sit at the edge).
const SAFE_TOP = 7;
const SAFE_BOTTOM = 90;
const SAFE_SIDE = 7;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function toScreenY(teamIndex: number, localY: number): number {
  return teamIndex === 0 ? (localY / 100) * 50 : 50 + (localY / 100) * 50;
}

function toLocalY(teamIndex: number, screenY: number): number {
  return teamIndex === 0 ? (screenY / 50) * 100 : ((screenY - 50) / 50) * 100;
}

export function DraggablePitch({ teams, playersPerSide, editable, onUpdate }: DraggablePitchProps) {
  const pitchRef = useRef<HTMLDivElement>(null);

  // Stable order: Team A (stored as "green") on the top half, drawn in team
  // red; Team B ("white") on the bottom half, drawn in team blue.
  const orderedTeams: Team[] = [
    teams.find((t) => t.color === "green") ?? teams[0],
    teams.find((t) => t.color === "white") ?? teams[1],
  ].filter(Boolean) as Team[];

  const validFormations = formationsFor(playersPerSide);
  const [formations, setFormations] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      orderedTeams.map((t) => [
        t.id,
        t.formation && validFormations.includes(t.formation) ? t.formation : validFormations[0],
      ]),
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

    const newX = clamp(current.x + dxPct, SAFE_SIDE, 100 - SAFE_SIDE);
    const rawScreenY = currentScreenY + dyPct;
    const [minSY, maxSY] = teamIndex === 0 ? [SAFE_TOP, 48] : [52, SAFE_BOTTOM];
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
            <span className={`t-title text-[1.2rem] ${idx === 0 ? "text-team-red" : "text-team-blue"}`}>
              {team.label}
            </span>
            {editable ? (
              <FormationPicker
                onChange={(f) => handleFormationChange(team, idx, f)}
                playersPerSide={playersPerSide}
                value={formations[team.id]}
              />
            ) : (
              <p className="text-[16px] font-semibold tabular-nums">Formation {formations[team.id]}</p>
            )}
            {editable && (
              <button
                className="tap-target self-start text-[14px] font-semibold underline decoration-2"
                onClick={() => handleSnap(team, idx)}
                type="button"
              >
                Reset to formation
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Pitch */}
      <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
        <div
          ref={pitchRef}
          className="relative my-6 w-full border-2 border-fg bg-ground text-fg"
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
              stroke="currentColor" strokeOpacity="0.55"
              strokeWidth="0.8"
              width="94"
              x="3"
              y="3"
            />
            {/* Centre line */}
            <line
              stroke="currentColor" strokeOpacity="0.55"
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
              stroke="currentColor" strokeOpacity="0.4"
              strokeWidth="0.8"
            />
            <circle cx="50" cy="75" fill="currentColor" r="1" />
            {/* Top penalty box */}
            <rect
              fill="none"
              height="22"
              stroke="currentColor" strokeOpacity="0.4"
              strokeWidth="0.7"
              width="50"
              x="25"
              y="3"
            />
            {/* Top 6-yard box */}
            <rect
              fill="none"
              height="10"
              stroke="currentColor" strokeOpacity="0.3"
              strokeWidth="0.6"
              width="28"
              x="36"
              y="3"
            />
            {/* Bottom penalty box */}
            <rect
              fill="none"
              height="22"
              stroke="currentColor" strokeOpacity="0.4"
              strokeWidth="0.7"
              width="50"
              x="25"
              y="125"
            />
            {/* Bottom 6-yard box */}
            <rect
              fill="none"
              height="10"
              stroke="currentColor" strokeOpacity="0.3"
              strokeWidth="0.6"
              width="28"
              x="36"
              y="137"
            />
          </svg>

          {/* Team half labels */}
          <span className="pointer-events-none absolute -top-6 left-0 text-[13px] font-bold text-team-red">
            {orderedTeams[0]?.label}
          </span>
          <span className="pointer-events-none absolute -bottom-6 left-0 text-[13px] font-bold text-team-blue">
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
                  screenX={clamp(pos.x, SAFE_SIDE, 100 - SAFE_SIDE)}
                  screenY={clamp(toScreenY(teamIndex, pos.y), SAFE_TOP, SAFE_BOTTOM)}
                  side={teamIndex}
                />
              );
            }),
          )}
        </div>
      </DndContext>
    </div>
  );
}

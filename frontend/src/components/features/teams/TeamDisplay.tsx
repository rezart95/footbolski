import { DraggablePitch } from "../formation/DraggablePitch";
import { cn } from "../../../lib/utils";
import type { FormationPayload, Team } from "../../../types/team.types";

interface TeamDisplayProps {
  teams: Team[];
  playersPerSide: number;
  /** The organiser may drag players and change formations. */
  editable: boolean;
  onUpdateFormation: (payload: FormationPayload) => void;
}

// The first side is always the red team, the second the blue: the two team
// inks of the design system, whatever colour label the API stores.
const TEAM_FIELDS = ["bg-poster-red", "bg-poster-blue"];

/** The split: two team panels, then the pitch with both line-ups on it. */
export function TeamDisplay({ teams, playersPerSide, editable, onUpdateFormation }: TeamDisplayProps) {
  // Same order the pitch uses: Team A ("green" in the API) first.
  const ordered = [
    teams.find((t) => t.color === "green") ?? teams[0],
    teams.find((t) => t.color === "white") ?? teams[1]
  ].filter(Boolean) as Team[];

  return (
    <div className="grid gap-6">
      <div className="-mx-4 grid sm:mx-0 sm:grid-cols-2">
        {ordered.map((team, index) => (
          <div className={cn("px-5 py-5 text-paper", TEAM_FIELDS[index % 2])} key={team.id}>
            <h3 className="t-title text-[1.6rem]">{team.label}</h3>
            <ul className="mt-3 divide-y divide-paper/30">
              {team.players.map((player) => (
                <li className="flex items-baseline justify-between gap-3 py-2" key={player.id}>
                  <span className="min-w-0 break-words text-[17px] font-semibold">{player.display_name}</span>
                  <span className="shrink-0 text-[14px] font-bold tracking-wide">{player.position_role}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div>
        <h3 className="t-title text-[1.35rem]">On the pitch</h3>
        {editable ? (
          <p className="mt-1 text-[15px] text-fg/75">Pick a formation, or hold and drag a player to move them.</p>
        ) : null}
        <div className="mt-3">
          <DraggablePitch editable={editable} onUpdate={onUpdateFormation} playersPerSide={playersPerSide} teams={ordered} />
        </div>
      </div>
    </div>
  );
}

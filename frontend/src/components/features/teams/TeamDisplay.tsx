import { useState } from "react";
import { FormationPicker } from "../formation/FormationPicker";
import { PitchCanvas } from "../formation/PitchCanvas";
import { formationsFor, slotsForFormation } from "../formation/formations";
import { cn } from "../../../lib/utils";
import type { Team } from "../../../types/team.types";

interface TeamDisplayProps {
  teams: Team[];
  playersPerSide: number;
  editable: boolean;
}

// The first side is always the red team, the second the blue: the two team
// inks of the design system, whatever colour label the API stores.
const TEAM_FIELDS = ["bg-poster-red", "bg-poster-blue"];

export function TeamDisplay({ teams, playersPerSide, editable }: TeamDisplayProps) {
  const initial = teams[0]?.formation || formationsFor(playersPerSide)[0];
  const [formation, setFormation] = useState(initial);

  function snap() {
    slotsForFormation(formation, true);
  }

  return (
    <div className="grid gap-5">
      <div className="-mx-4 grid sm:mx-0 sm:grid-cols-2">
        {teams.map((team, index) => (
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
      <FormationPicker playersPerSide={playersPerSide} readOnly={!editable} value={formation} onChange={setFormation} />
      <PitchCanvas editable={editable} formation={formation} teams={teams} onSnap={snap} />
    </div>
  );
}

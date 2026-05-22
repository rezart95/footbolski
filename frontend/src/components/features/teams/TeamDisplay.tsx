import { useState } from "react";
import { FormationPicker } from "../formation/FormationPicker";
import { PitchCanvas } from "../formation/PitchCanvas";
import { formationsFor, slotsForFormation } from "../formation/formations";
import type { Team } from "../../../types/team.types";

interface TeamDisplayProps {
  teams: Team[];
  playersPerSide: number;
  editable: boolean;
}

export function TeamDisplay({ teams, playersPerSide, editable }: TeamDisplayProps) {
  const initial = teams[0]?.formation || formationsFor(playersPerSide)[0];
  const [formation, setFormation] = useState(initial);

  function snap() {
    slotsForFormation(formation, true);
  }

  return (
    <section className="grid gap-4">
      <h2 className="font-display text-xl font-bold">Teams</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {teams.map((team) => (
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3" key={team.id}>
            <h3 className="font-display text-lg font-bold">{team.label}</h3>
            <div className="mt-3 grid gap-2">
              {team.players.map((player) => (
                <div className="flex items-center justify-between rounded-md bg-white/[0.04] p-2" key={player.id}>
                  <span className="truncate font-semibold">{player.display_name}</span>
                  <span className="rounded bg-white/10 px-2 py-1 font-mono text-xs font-black">{player.position_role}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <FormationPicker playersPerSide={playersPerSide} readOnly={!editable} value={formation} onChange={setFormation} />
      <PitchCanvas editable={editable} formation={formation} teams={teams} onSnap={snap} />
    </section>
  );
}

import { RotateCcw } from "lucide-react";
import { Button } from "../../ui/Button";
import { PlayerToken } from "./PlayerToken";
import { slotsForFormation } from "./formations";
import type { Team } from "../../../types/team.types";

interface PitchCanvasProps {
  teams: Team[];
  formation: string;
  editable: boolean;
  onSnap: () => void;
}

export function PitchCanvas({ teams, formation, editable, onSnap }: PitchCanvasProps) {
  return (
    <div className="grid gap-3">
      <svg className="aspect-[7/10] w-full rounded-lg border border-white/10 bg-pitch-800" viewBox="0 0 100 140" role="img">
        <rect x="4" y="4" width="92" height="132" rx="4" fill="none" stroke="rgba(255,255,255,0.24)" strokeWidth="1" />
        <line x1="4" x2="96" y1="70" y2="70" stroke="rgba(255,255,255,0.18)" />
        <circle cx="50" cy="70" r="10" fill="none" stroke="rgba(255,255,255,0.14)" />
        {teams.map((team, teamIndex) => {
          const topHalf = teamIndex === 0;
          const slots = slotsForFormation(team.formation || formation, topHalf);
          return team.players.map((player, index) => {
            const slot = slots[index] ?? slots[0];
            const x = player.pitch_x ?? slot.x;
            const localY = player.pitch_y ?? slot.y;
            return <PlayerToken key={player.id} player={player} teamColor={team.color} x={x} y={topHalf ? (localY / 100) * 70 : 70 + (localY / 100) * 70} />;
          });
        })}
      </svg>
      {editable ? (
        <Button icon={<RotateCcw size={18} />} onClick={onSnap} variant="secondary">
          Snap
        </Button>
      ) : null}
    </div>
  );
}

import { initials } from "../../../lib/utils";
import type { TeamPlayer } from "../../../types/team.types";

interface PlayerTokenProps {
  player: TeamPlayer;
  x: number;
  y: number;
  teamColor: string;
}

export function PlayerToken({ player, x, y, teamColor }: PlayerTokenProps) {
  const fill = teamColor === "green" ? "#3DDB6A" : "#F8FAFC";
  const text = teamColor === "green" ? "#0A1A0F" : "#111D14";

  return (
    <g transform={`translate(${x} ${y})`}>
      <circle fill={fill} r="5.2" stroke="rgba(10,26,15,0.8)" strokeWidth="0.8" />
      <text dy="1.5" fill={text} fontSize="3.6" fontWeight="800" textAnchor="middle">
        {initials(player.display_name)}
      </text>
      <text dy="10" fill="white" fontSize="3.5" fontWeight="700" textAnchor="middle">
        {player.display_name.split(" ")[0]}
      </text>
    </g>
  );
}

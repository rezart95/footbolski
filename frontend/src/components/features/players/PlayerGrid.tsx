import type { Player } from "../../../types/player.types";
import { PlayerCard } from "./PlayerCard";

interface PlayerGridProps {
  players: Player[];
  onSelect: (player: Player) => void;
}

export function PlayerGrid({ players, onSelect }: PlayerGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
      {players.map((player) => (
        <PlayerCard key={player.id} player={player} onClick={() => onSelect(player)} />
      ))}
    </div>
  );
}

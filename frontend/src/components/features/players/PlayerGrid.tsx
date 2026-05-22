import type { Player } from "../../../types/player.types";
import { PlayerCard } from "./PlayerCard";

interface PlayerGridProps {
  players: Player[];
  onSelect: (player: Player) => void;
}

export function PlayerGrid({ players, onSelect }: PlayerGridProps) {
  return (
    <>
      {/* Mobile: full-width snap carousel, one card at a time */}
      <div className="-mx-4 flex snap-x snap-mandatory overflow-x-auto pb-2 sm:hidden [&::-webkit-scrollbar]:hidden">
        {players.map((player) => (
          <div key={player.id} className="w-screen shrink-0 snap-center px-4">
            <PlayerCard player={player} onClick={() => onSelect(player)} />
          </div>
        ))}
      </div>

      {/* sm+: regular grid */}
      <div className="hidden grid-cols-2 gap-3 sm:grid md:grid-cols-3 xl:grid-cols-4">
        {players.map((player) => (
          <PlayerCard key={player.id} player={player} onClick={() => onSelect(player)} />
        ))}
      </div>
    </>
  );
}

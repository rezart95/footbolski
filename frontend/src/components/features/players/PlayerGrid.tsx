import type { Player, PlayerPosition } from "../../../types/player.types";
import { PlayerCard } from "./PlayerCard";

interface PlayerGridProps {
  players: Player[];
  onSelect: (player: Player) => void;
  myName?: string;
}

const GROUPS: { position: PlayerPosition; title: string }[] = [
  { position: "GK", title: "Keepers" },
  { position: "DEF", title: "Defenders" },
  { position: "MID", title: "Midfield" },
  { position: "ATT", title: "Attack" }
];

/** The squad as a team sheet: grouped by position, each group under its own
 * poster headline with a head count, cards in a two- or three-column grid. */
export function PlayerGrid({ players, onSelect, myName = "" }: PlayerGridProps) {
  const me = myName.trim().toLowerCase();
  return (
    <div className="grid gap-10">
      {GROUPS.map(({ position, title }) => {
        const group = players
          .filter((p) => p.primary_position === position)
          .sort((a, b) => a.name.localeCompare(b.name));
        if (group.length === 0) return null;
        return (
          <section aria-labelledby={`group-${position}`} key={position}>
            <div className="flex items-end justify-between border-b-2 border-fg pb-2">
              <h2 className="t-headline text-[2.1rem]" id={`group-${position}`}>
                {title}
              </h2>
              <p className="t-numeral text-[2.1rem]">{group.length}</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3">
              {group.map((player) => (
                <PlayerCard
                  isMe={player.name.trim().toLowerCase() === me}
                  key={player.id}
                  player={player}
                  onClick={() => onSelect(player)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

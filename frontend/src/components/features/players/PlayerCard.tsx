import { colorFromName, initials } from "../../../lib/utils";
import type { Player } from "../../../types/player.types";
import { AttributeTag } from "./AttributeTag";

interface PlayerCardProps {
  player: Player;
  onClick: () => void;
}

export function PlayerCard({ player, onClick }: PlayerCardProps) {
  return (
    <button className="grid min-h-56 gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-3 text-left" onClick={onClick} type="button">
      <div className="flex items-start gap-3">
        {player.photo_url ? (
          <img alt="" className="h-16 w-16 rounded-lg object-cover" src={player.photo_url} />
        ) : (
          <div className={`grid h-16 w-16 place-items-center rounded-lg ${colorFromName(player.name)} font-display text-xl font-bold text-pitch-950`}>
            {initials(player.name)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-lg font-bold">{player.name}</h3>
          <p className="mt-1 inline-flex rounded-md bg-white/10 px-2 py-1 font-mono text-xs font-black">{player.primary_position}</p>
        </div>
      </div>
      <div className="grid grid-cols-10 gap-1">
        {Array.from({ length: 10 }).map((_, index) => (
          <span className={`h-2 rounded-full ${index < player.skill_rating ? "bg-pitch-400" : "bg-white/10"}`} key={index} />
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {player.attributes.slice(0, 4).map((attribute) => (
          <AttributeTag attribute={attribute} key={attribute} />
        ))}
      </div>
    </button>
  );
}

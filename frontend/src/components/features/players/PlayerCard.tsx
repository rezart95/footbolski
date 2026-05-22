import { colorFromName, initials } from "../../../lib/utils";
import type { Player } from "../../../types/player.types";
import { AttributeTag } from "./AttributeTag";

interface PlayerCardProps {
  player: Player;
  onClick: () => void;
}

export function PlayerCard({ player, onClick }: PlayerCardProps) {
  return (
    <button className="surface flex flex-col overflow-hidden rounded-xl text-left transition hover:border-pitch-400/35" onClick={onClick} type="button">
      {/* Photo / avatar – square crop */}
      <div className="relative aspect-square w-full">
        {player.photo_url ? (
          <img alt={player.name} className="h-full w-full object-cover" src={player.photo_url} />
        ) : (
          <div className={`flex h-full w-full items-center justify-center font-display text-4xl font-bold text-pitch-950 ${colorFromName(player.name)}`}>
            {initials(player.name)}
          </div>
        )}
        {/* Position badge – bottom-right overlay */}
        <span className="absolute bottom-2 right-2 rounded-md bg-pitch-950/80 px-2 py-0.5 font-mono text-xs font-black text-pitch-400 ring-1 ring-pitch-400/30">
          {player.primary_position}
        </span>
      </div>

      {/* Info section */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="truncate font-display text-base font-bold leading-tight">{player.name}</p>

        {/* Skill rating bar */}
        <div className="flex items-center gap-1.5">
          <div className="flex flex-1 gap-px">
            {Array.from({ length: 10 }).map((_, i) => (
              <span className={`h-1 flex-1 rounded-full ${i < player.skill_rating ? "bg-pitch-400" : "bg-white/12"}`} key={i} />
            ))}
          </div>
          <span className="font-mono text-[10px] font-bold text-white/40">{player.skill_rating}</span>
        </div>

        {/* Attribute tags */}
        {player.attributes.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {player.attributes.slice(0, 3).map((attribute) => (
              <AttributeTag attribute={attribute} key={attribute} />
            ))}
          </div>
        )}
      </div>
    </button>
  );
}

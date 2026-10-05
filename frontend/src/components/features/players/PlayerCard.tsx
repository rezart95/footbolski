import { initials } from "../../../lib/utils";
import { cn } from "../../../lib/utils";
import type { Player } from "../../../types/player.types";

export const STATS: { key: keyof Player; label: string; name: string }[] = [
  { key: "speed", label: "SPD", name: "Speed" },
  { key: "technique", label: "TEC", name: "Technique" },
  { key: "passing", label: "PAS", name: "Passing" },
  { key: "defending", label: "DEF", name: "Defending" },
  { key: "shooting", label: "SHT", name: "Shooting" },
  { key: "aerial", label: "AER", name: "Aerial" },
  { key: "stamina", label: "STA", name: "Stamina" },
  { key: "work_rate", label: "WRK", name: "Work rate" }
];

/** A player's photo in a square ink frame, full colour as uploaded. Under it
 * sits the player's initials as an ink poster, so a card with no photo (or one
 * still loading) is a printed monogram, never an empty grey box. */
export function PlayerPhoto({ player, className }: { player: Pick<Player, "name" | "photo_url">; className?: string }) {
  return (
    <div className={cn("field-inverse relative aspect-square overflow-hidden border-2 border-fg", className)}>
      <div aria-hidden="true" className="t-headline absolute inset-0 grid place-items-center text-[3.25rem]">
        {initials(player.name)}
      </div>
      {player.photo_url ? (
        <img alt="" className="relative h-full w-full object-cover" loading="lazy" src={player.photo_url} />
      ) : null}
    </div>
  );
}

/** Eight attribute bars, one flat ink bar each out of ten. */
export function StatBars({ player, size = "sm" }: { player: Player; size?: "sm" | "lg" }) {
  const stats = STATS.filter(({ key }) => player[key] != null);
  if (stats.length === 0) return null;
  return (
    <dl className={cn("grid grid-cols-2", size === "lg" ? "gap-x-6 gap-y-2.5" : "gap-x-3 gap-y-1.5")}>
      {stats.map(({ key, label, name }) => {
        const value = player[key] as number;
        return (
          <div className="flex items-center gap-2" key={key}>
            <dt className={cn("shrink-0 font-bold tracking-wide", size === "lg" ? "w-10 text-[13px]" : "w-8 text-[12px]")}>
              <abbr className="no-underline" title={name}>
                {label}
              </abbr>
            </dt>
            <dd className="flex flex-1 items-center gap-2">
              <span className={cn("relative flex-1 bg-fg/15", size === "lg" ? "h-2" : "h-1.5")}>
                <span className="absolute inset-y-0 left-0 bg-fg" style={{ width: `${value * 10}%` }} />
              </span>
              <span className={cn("w-4 text-right font-semibold tabular-nums", size === "lg" ? "text-[14px]" : "text-[12px]")}>
                {value}
              </span>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

interface PlayerCardProps {
  player: Player;
  onClick: () => void;
  isMe?: boolean;
}

/** A squad-sheet entry: photo, name, skill numeral and role. The eight
 * attribute bars are too small to read at two columns, so they live on the
 * full card that opens on tap (and on the You tab). */
export function PlayerCard({ player, onClick, isMe = false }: PlayerCardProps) {
  const meta = [player.age ? `${player.age} y` : null, player.height_cm ? `${player.height_cm} cm` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <button
      aria-label={`${player.name}, ${player.primary_position}, skill ${player.skill_rating} of 10${isMe ? ", your card" : ""}`}
      className="group flex w-full flex-col text-left"
      onClick={onClick}
      type="button"
    >
      <div className="relative">
        <PlayerPhoto className="transition-[border-width] duration-150 group-hover:border-[3px]" player={player} />
        {isMe ? (
          <span className="field-inverse absolute left-0 top-0 px-2 py-0.5 text-[12px] font-bold uppercase tracking-wider">You</span>
        ) : null}
      </div>
      <div className="mt-2 flex items-start justify-between gap-2">
        <p className="min-w-0 break-words text-[16px] font-bold leading-tight">{player.name}</p>
        <p aria-hidden="true" className="t-numeral shrink-0 text-[1.6rem] leading-none">
          {player.skill_rating}
        </p>
      </div>
      <p aria-hidden="true" className="mt-0.5 text-[13px] font-medium text-fg/75">
        {player.preferred_role ?? player.primary_position}
        {meta ? ` · ${meta}` : ""}
      </p>
    </button>
  );
}

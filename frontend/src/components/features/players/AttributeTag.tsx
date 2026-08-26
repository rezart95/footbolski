import { cn } from "../../../lib/utils";
import type { PlayerAttribute } from "../../../types/player.types";

interface AttributeTagProps {
  attribute: PlayerAttribute;
  active?: boolean;
  onClick?: () => void;
}

export function AttributeTag({ attribute, active = true, onClick }: AttributeTagProps) {
  const label = attribute[0].toUpperCase() + attribute.slice(1);
  const classes = active ? "bg-pitch-400/15 text-pitch-400" : "bg-white/5 text-white/45";

  if (onClick) {
    return (
      <button className={cn("tap-target rounded-full px-3 text-xs font-bold", classes)} onClick={onClick} type="button">
        {label}
      </button>
    );
  }

  return <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", classes)}>{label}</span>;
}

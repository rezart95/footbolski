import { Bell } from "lucide-react";

interface RemindButtonProps {
  onClick: () => void;
  disabled?: boolean;
  name?: string;
  /** Drawn on an inverted ink field (your own row). */
  inverse?: boolean;
}

export function RemindButton({ onClick, disabled, name, inverse = false }: RemindButtonProps) {
  return (
    <button
      aria-label={name ? `Remind ${name} to pay` : "Send reminder"}
      className={`tap-target grid shrink-0 place-items-center disabled:opacity-40 ${inverse ? "text-ground hover:bg-ground/10" : "text-fg hover:bg-fg/[0.07]"}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <Bell size={19} />
    </button>
  );
}

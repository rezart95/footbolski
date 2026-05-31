import { Bell } from "lucide-react";

interface RemindButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function RemindButton({ onClick, disabled }: RemindButtonProps) {
  return (
    <button
      aria-label="Send reminder"
      className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/8 px-2.5 py-1 text-xs font-bold text-white/55 transition hover:bg-amber-400/15 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <Bell size={13} />
      Remind
    </button>
  );
}

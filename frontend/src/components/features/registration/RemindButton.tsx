import { Bell } from "lucide-react";

interface RemindButtonProps {
  onClick: () => void;
  disabled?: boolean;
  name?: string;
}

export function RemindButton({ onClick, disabled, name }: RemindButtonProps) {
  return (
    <button
      aria-label={name ? `Remind ${name} to pay` : "Send reminder"}
      className="tap-target grid shrink-0 place-items-center text-fg hover:bg-fg/[0.07] disabled:opacity-40"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <Bell size={19} />
    </button>
  );
}

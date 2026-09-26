import { Check } from "lucide-react";
import { cn } from "../../../lib/utils";

interface PaymentToggleProps {
  paid: boolean;
  onToggle: () => void;
  disabled?: boolean;
  /** Whose payment this is, for the accessible label. */
  name?: string;
  /** Drawn on an inverted ink field (your own row). */
  inverse?: boolean;
}

/** Paid is money, so a paid chip is ochre; unpaid is an ink-ruled question. */
export function PaymentToggle({ paid, onToggle, disabled, name, inverse = false }: PaymentToggleProps) {
  const who = name ? ` for ${name}` : "";
  return (
    <button
      aria-label={paid ? `Paid${who}. Tap to undo` : `Mark paid${who}`}
      aria-pressed={paid}
      className={cn(
        "tap-target flex shrink-0 items-center justify-center gap-1.5 px-3 text-[14px] font-bold transition-colors duration-150 disabled:opacity-40",
        paid
          ? "bg-poster-ochre text-ink"
          : inverse
            ? "border-2 border-ground/70 text-ground hover:border-ground"
            : "border-2 border-fg/60 text-fg hover:border-fg"
      )}
      disabled={disabled}
      onClick={onToggle}
      type="button"
    >
      {paid ? <Check size={16} strokeWidth={3} /> : null}
      {paid ? "Paid" : "Paid?"}
    </button>
  );
}

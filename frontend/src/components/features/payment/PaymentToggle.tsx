import { CheckCircle2, Circle } from "lucide-react";

interface PaymentToggleProps {
  paid: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function PaymentToggle({ paid, onToggle, disabled }: PaymentToggleProps) {
  return (
    <button
      aria-label={paid ? "Undo payment" : "I paid"}
      className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition ${
        paid
          ? "bg-pitch-400/20 text-pitch-400"
          : "bg-white/8 text-white/30 hover:bg-white/12 hover:text-white/60"
      }`}
      disabled={disabled}
      onClick={onToggle}
      type="button"
    >
      {paid ? <CheckCircle2 size={13} /> : <Circle size={13} />}
      {paid ? "Paid" : "Paid?"}
    </button>
  );
}

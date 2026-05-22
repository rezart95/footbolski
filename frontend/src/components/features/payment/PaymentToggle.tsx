import { CheckCircle2, Circle } from "lucide-react";
import { Button } from "../../ui/Button";

interface PaymentToggleProps {
  paid: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function PaymentToggle({ paid, onToggle, disabled }: PaymentToggleProps) {
  return (
    <Button
      aria-label={paid ? "Mark unpaid" : "Mark paid"}
      className={paid ? "text-pitch-400" : "text-white/45"}
      disabled={disabled}
      icon={paid ? <CheckCircle2 size={22} /> : <Circle size={22} />}
      onClick={onToggle}
      variant="ghost"
    />
  );
}

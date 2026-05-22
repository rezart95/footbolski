import { LogIn, LogOut } from "lucide-react";
import { Button } from "../../ui/Button";
import type { EventSummary } from "../../../types/event.types";
import type { Registration } from "../../../types/registration.types";

interface JoinButtonProps {
  event: EventSummary;
  registration?: Registration;
  onJoin: () => void;
  onLeave: () => void;
  busy?: boolean;
}

export function JoinButton({ event, registration, onJoin, onLeave, busy }: JoinButtonProps) {
  if (registration) {
    const label = registration.list_status === "waitlist" ? "Leave Waitlist" : "Leave";
    return <Button disabled={busy} icon={<LogOut size={18} />} onClick={onLeave} variant="secondary">{label}</Button>;
  }

  const full = event.confirmed_count >= event.max_players;
  return (
    <Button disabled={busy || event.status !== "upcoming"} icon={<LogIn size={18} />} onClick={onJoin}>
      {full ? "Join Waitlist" : "Join"}
    </Button>
  );
}

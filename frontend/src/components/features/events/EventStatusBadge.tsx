import { cn } from "../../../lib/utils";
import type { EventStatus } from "../../../types/event.types";

const labels: Record<EventStatus, string> = {
  upcoming: "Upcoming",
  cancelled: "Cancelled",
  completed: "Completed"
};

const styles: Record<EventStatus, string> = {
  upcoming: "bg-pitch-400/15 text-pitch-400",
  cancelled: "bg-white/10 text-white/45",
  completed: "bg-sky-400/15 text-sky-200"
};

export function EventStatusBadge({ status }: { status: EventStatus }) {
  return <span className={cn("rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide", styles[status])}>{labels[status]}</span>;
}

import { cn } from "../../../lib/utils";
import type { EventStatus } from "../../../types/event.types";

const labels: Record<EventStatus, string> = {
  upcoming: "Upcoming",
  cancelled: "Cancelled",
  completed: "Completed"
};

const styles: Record<EventStatus, string> = {
  upcoming: "bg-pitch-400/15 text-pitch-400",
  cancelled: "border border-red-200/25 bg-red-500/15 text-red-100",
  completed: "bg-sky-400/15 text-sky-200"
};

export function EventStatusBadge({ status }: { status: EventStatus }) {
  return <span className={cn("rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide", styles[status])}>{labels[status]}</span>;
}

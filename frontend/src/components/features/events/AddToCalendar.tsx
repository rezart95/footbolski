import { useState } from "react";
import { Apple, CalendarPlus } from "lucide-react";
import { Button } from "../../ui/Button";
import { Modal } from "../../ui/Modal";
import { eventCalendarUrl, googleCalendarUrl, outlookCalendarUrl } from "../../../lib/calendar";
import type { EventSummary } from "../../../types/event.types";

interface AddToCalendarProps {
  event: EventSummary;
  /** Text next to the icon. Omit for an icon-only button (e.g. a compact header row). */
  label?: string;
  className?: string;
}

/** "Add to calendar" that lets each person pick their own calendar so the event
 * is added directly, instead of forcing a one-size .ics download. Google and
 * Outlook open their calendar with the match pre-filled (no file); the .ics
 * route opens the native add sheet on iOS and imports into Apple Calendar. */
export function AddToCalendar({ event, label, className }: AddToCalendarProps) {
  const [open, setOpen] = useState(false);

  const options = [
    { key: "google", name: "Google Calendar", note: "Opens Google Calendar to save", href: googleCalendarUrl(event), external: true, Icon: CalendarPlus },
    { key: "outlook", name: "Outlook", note: "Opens Outlook to save", href: outlookCalendarUrl(event), external: true, Icon: CalendarPlus },
    { key: "apple", name: "Apple / other", note: "Opens your calendar app (.ics)", href: eventCalendarUrl(event.id), external: false, Icon: Apple },
  ];

  return (
    <>
      <Button
        aria-label="Add to calendar"
        className={className}
        icon={<CalendarPlus size={20} />}
        onClick={() => setOpen(true)}
        variant="secondary"
      >
        {label}
      </Button>

      <Modal open={open} title="Add to calendar" onClose={() => setOpen(false)}>
        <div className="grid gap-3">
          <p className="text-sm text-white/65">Pick your calendar — the match opens ready to save.</p>
          {options.map((o) => (
            <a
              key={o.key}
              className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-4 text-left transition hover:bg-white/[0.08]"
              href={o.href}
              onClick={() => setOpen(false)}
              rel={o.external ? "noopener noreferrer" : undefined}
              target={o.external ? "_blank" : undefined}
            >
              <o.Icon className="shrink-0 text-pitch-400" size={20} />
              <div>
                <p className="font-bold">{o.name}</p>
                <p className="text-xs text-white/55">{o.note}</p>
              </div>
            </a>
          ))}
        </div>
      </Modal>
    </>
  );
}

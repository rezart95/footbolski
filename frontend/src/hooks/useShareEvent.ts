import { useState } from "react";
import type { EventSummary } from "../types/event.types";

/** Shares an event link via the OS share sheet (WhatsApp, Messages, etc. all
 * appear there on mobile) — falls back to copying the link when the Web
 * Share API isn't available (most desktop browsers). */
export function useShareEvent(event: Pick<EventSummary, "id" | "venue"> | undefined) {
  const [copied, setCopied] = useState(false);

  async function share(e?: { preventDefault?: () => void; stopPropagation?: () => void }) {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!event) return;
    const url = `${window.location.origin}/events/${event.id}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "Footbolski", text: `Football at ${event.venue.name}`, url });
      } catch {
        /* user dismissed the share sheet — not an error */
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — nothing more we can do */
    }
  }

  return { share, copied };
}

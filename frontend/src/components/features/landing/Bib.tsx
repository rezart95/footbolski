import { cn } from "../../../lib/utils";

const BIB_PATH =
  "M8 1 H15 C16.5 6 23.5 6 25 1 H32 C32.5 8 35 12 39 13 V43 C39 44.1 38.1 45 37 45 H3 C1.9 45 1 44.1 1 43 V13 C5 12 7.5 8 8 1 Z";

type BibState = "taken" | "waiting";

/** A training bib, the thing a spot on the list turns into on the night.
 * Taken spots are solid ink; the waitlist hangs loose beside the page. */
export function Bib({ number, state, className }: { number: number; state: BibState; className?: string }) {
  return (
    <svg viewBox="0 0 40 46" className={cn("block overflow-visible", className)} aria-hidden="true" focusable="false">
      <path
        d={BIB_PATH}
        className={cn(
          state === "taken" && "fill-ink",
          state === "waiting" && "fill-paper stroke-ink [stroke-width:1.6]"
        )}
      />
      <text
        x="20"
        y="33"
        textAnchor="middle"
        className={cn(
          "font-poster tabular-nums",
          state === "taken" && "fill-paper",
          state === "waiting" && "fill-ink"
        )}
        style={{ fontSize: 15, fontWeight: 800, fontStretch: "80%" }}
      >
        {number}
      </text>
    </svg>
  );
}

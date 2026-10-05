import { cn } from "../../../lib/utils";

/** FOOTBOLSKI set edge to edge like poster lettering. SVG `textLength` makes
 * the word fill its box exactly at every width, which CSS text cannot do. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1000 140" role="img" aria-label="Footbolski" className={cn("block w-full", className)}>
      <text
        x="0"
        y="132"
        textLength="1000"
        lengthAdjust="spacingAndGlyphs"
        className="fill-current font-poster"
        style={{ fontSize: 178, fontWeight: 900, fontStretch: "88%" }}
      >
        FOOTBOLSKI
      </text>
    </svg>
  );
}

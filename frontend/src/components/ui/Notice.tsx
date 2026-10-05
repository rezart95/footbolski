import type { ReactNode } from "react";
import { AlertTriangle, Check, Info } from "lucide-react";
import { cn } from "../../lib/utils";

type Tone = "info" | "error" | "success";

// No hues here: red and blue belong to the teams. An error is the loudest thing
// the ink can do, an inverted field; info and success are ink-ruled.
const tones = {
  info: "border-2 border-fg text-fg",
  error: "field-inverse",
  success: "border-2 border-fg text-fg"
};

const icons = {
  info: Info,
  error: AlertTriangle,
  success: Check
};

export function Notice({ children, tone = "info" }: { children: ReactNode; tone?: Tone }) {
  const Icon = icons[tone];
  return (
    <div
      className={cn("flex items-start gap-3 px-3 py-3 text-[15px] font-semibold leading-snug", tones[tone])}
      role={tone === "error" ? "alert" : "status"}
    >
      <Icon className="mt-0.5 shrink-0" size={18} strokeWidth={2.25} />
      <div>{children}</div>
    </div>
  );
}

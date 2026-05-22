import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

type Tone = "info" | "error" | "success";

const tones = {
  info: "border-sky-300/20 bg-sky-300/10 text-sky-100",
  error: "border-red-300/25 bg-red-400/10 text-red-100",
  success: "border-pitch-400/25 bg-pitch-400/10 text-pitch-400"
};

const icons = {
  info: Info,
  error: AlertCircle,
  success: CheckCircle2
};

export function Notice({ children, tone = "info" }: { children: ReactNode; tone?: Tone }) {
  const Icon = icons[tone];
  return (
    <div className={`flex items-start gap-3 rounded-lg border px-3 py-3 text-sm font-semibold ${tones[tone]}`}>
      <Icon className="mt-0.5 shrink-0" size={17} />
      <div>{children}</div>
    </div>
  );
}

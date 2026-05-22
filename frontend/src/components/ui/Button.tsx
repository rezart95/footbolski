import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: ReactNode;
}

const variants: Record<Variant, string> = {
  primary: "bg-pitch-400 text-pitch-950 shadow-[0_12px_28px_rgba(61,219,106,0.18)] hover:bg-emerald-300",
  secondary: "border border-white/10 bg-white/10 text-white hover:bg-white/15",
  ghost: "bg-transparent text-white hover:bg-white/10",
  danger: "border border-red-300/15 bg-red-500/15 text-red-100 hover:bg-red-500/25"
};

export function Button({ className, children, variant = "primary", icon, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "tap-target inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-extrabold transition disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}

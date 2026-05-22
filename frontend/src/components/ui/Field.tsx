import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

interface FieldProps {
  label: string;
  children: ReactNode;
}

export function Field({ label, children }: FieldProps) {
  return (
    <label className="grid gap-2 text-sm font-bold text-white/70">
      {label}
      {children}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn("tap-target rounded-lg border border-white/10 bg-white/[0.07] px-3 text-base text-white outline-none focus:border-pitch-400", props.className)}
      {...props}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn("tap-target rounded-lg border border-white/10 bg-pitch-800 px-3 text-base font-semibold text-white outline-none focus:border-pitch-400", props.className)}
      {...props}
    />
  );
}

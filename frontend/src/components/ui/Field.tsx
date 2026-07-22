import { Check } from "lucide-react";
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

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  children: ReactNode;
}

/** A labelled checkbox. The native input stays in the DOM for keyboard and
 * screen-reader support and is visually replaced by the box we draw, so focus
 * and the space bar keep working. The whole row is the tap target. */
export function Checkbox({ children, className, ...props }: CheckboxProps) {
  return (
    <label className={cn("tap-target flex cursor-pointer items-start gap-3 py-1", className)}>
      <input className="peer sr-only" type="checkbox" {...props} />
      <span
        aria-hidden
        className="mt-0.5 grid h-6 w-6 flex-none place-items-center rounded-md border border-white/25 bg-white/[0.07] text-pitch-950 transition [&>svg]:opacity-0 peer-checked:border-pitch-400 peer-checked:bg-pitch-400 peer-checked:[&>svg]:opacity-100 peer-focus-visible:ring-2 peer-focus-visible:ring-pitch-400 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-pitch-950"
      >
        <Check className="transition" size={16} strokeWidth={3} />
      </span>
      <span className="text-sm font-semibold leading-snug text-white/75">{children}</span>
    </label>
  );
}

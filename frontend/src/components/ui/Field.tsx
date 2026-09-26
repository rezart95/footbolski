import { Check } from "lucide-react";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

interface FieldProps {
  label: string;
  children: ReactNode;
}

export function Field({ label, children }: FieldProps) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-fg">
      {label}
      {children}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn("tap-target w-full border-2 border-fg bg-ground px-3 text-base text-fg placeholder:text-fg/55 disabled:opacity-40", props.className)}
      {...props}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn("tap-target w-full border-2 border-fg bg-ground px-3 text-base font-semibold text-fg disabled:opacity-40", props.className)}
      {...props}
    />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn("min-h-[4.5rem] w-full border-2 border-fg bg-ground px-3 py-2 text-base text-fg placeholder:text-fg/55 disabled:opacity-40", props.className)}
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
        className="mt-0.5 grid h-6 w-6 flex-none place-items-center border-2 border-fg bg-ground text-ground transition-colors duration-150 [&>svg]:opacity-0 peer-checked:bg-fg peer-checked:[&>svg]:opacity-100 peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-fg peer-disabled:opacity-40"
      >
        <Check className="transition" size={16} strokeWidth={3} />
      </span>
      <span className="text-[15px] font-medium leading-snug text-fg">{children}</span>
    </label>
  );
}

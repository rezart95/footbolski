import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface CommonProps {
  variant?: Variant;
  icon?: ReactNode;
}

type ButtonAsButton = CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type ButtonAsAnchor = CommonProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

type ButtonProps = ButtonAsButton | ButtonAsAnchor;

const variants: Record<Variant, string> = {
  primary: "bg-pitch-400 text-pitch-950 shadow-[0_12px_28px_rgba(61,219,106,0.18)] hover:bg-emerald-300",
  secondary: "border border-white/10 bg-white/10 text-white hover:bg-white/15",
  ghost: "bg-transparent text-white hover:bg-white/10",
  danger: "border border-red-300/15 bg-red-500/15 text-red-100 hover:bg-red-500/25"
};

/** Renders as `<a>` when `href` is given, `<button>` otherwise — same look
 * either way, so a link-triggered action (like opening a file the browser
 * should navigate to rather than fetch via JS) doesn't need its own styling. */
export function Button({ className, children, variant = "primary", icon, href, ...props }: ButtonProps) {
  const classes = cn(
    "tap-target inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-extrabold transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
    variants[variant],
    className
  );

  if (href !== undefined) {
    return (
      <a className={classes} href={href} {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {icon}
        {children}
      </a>
    );
  }

  return (
    <button className={classes} {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {icon}
      {children}
    </button>
  );
}

import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "inverse" | "inverse-outline";

interface CommonProps {
  variant?: Variant;
  icon?: ReactNode;
}

type ButtonAsButton = CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type ButtonAsAnchor = CommonProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

type ButtonProps = ButtonAsButton | ButtonAsAnchor;

// Square ink controls. Red and blue are team colours, so destructive actions
// are not red: `danger` is an outlined button that always sits behind a confirm.
const variants: Record<Variant, string> = {
  primary: "bg-fg text-ground hover:bg-fg/85",
  secondary: "border-2 border-fg text-fg hover:bg-fg/[0.07]",
  ghost: "text-fg hover:bg-fg/[0.07]",
  danger: "border-2 border-fg text-fg underline decoration-2 underline-offset-[0.2em] hover:bg-fg/[0.07]",
  // For use on an inverted ink field (`field-inverse`).
  inverse: "bg-ground text-fg hover:bg-ground/85",
  "inverse-outline": "border-2 border-ground text-ground hover:bg-ground/10"
};

const base =
  "tap-target inline-flex items-center justify-center gap-2 px-4 py-3 text-[15px] font-bold transition-[background-color,transform] duration-150 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40 disabled:active:translate-y-0";

/** The button look for elements that aren't this component, e.g. a router
 * `<Link>` that should read as a primary action. */
export function buttonClass(variant: Variant = "primary", className?: string) {
  return cn(base, variants[variant], className);
}

/** Renders as `<a>` when `href` is given, `<button>` otherwise — same look
 * either way, so a link-triggered action (like opening a file the browser
 * should navigate to rather than fetch via JS) doesn't need its own styling. */
export function Button({ className, children, variant = "primary", icon, href, ...props }: ButtonProps) {
  const classes = buttonClass(variant, className);

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

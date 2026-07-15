import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
}

/** Consistent page title row: optional accent eyebrow, an h1, and an optional
 * action (e.g. a create button) on the right. Used across all top-level pages. */
export function PageHeader({ title, eyebrow, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-xs font-bold uppercase tracking-wide text-pitch-400">{eyebrow}</p>
        ) : null}
        <h1 className="font-display text-3xl font-bold leading-tight">{title}</h1>
      </div>
      {action ? <div className="flex-none">{action}</div> : null}
    </div>
  );
}

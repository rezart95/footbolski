import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  detail?: string;
  action?: ReactNode;
}

export function EmptyState({ title, detail, action }: EmptyStateProps) {
  return (
    <div className="surface grid gap-4 rounded-lg p-6 text-center">
      <div>
        <h2 className="font-display text-2xl font-bold">{title}</h2>
        {detail ? <p className="mt-2 text-sm text-white/60">{detail}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

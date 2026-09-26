import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  detail?: string;
  action?: ReactNode;
  /** Optional drawing set above the title, e.g. the still split ball. */
  art?: ReactNode;
}

/** An empty screen that says what goes here and how to put it there. */
export function EmptyState({ title, detail, action, art }: EmptyStateProps) {
  return (
    <div className="grid gap-5 py-6">
      {art}
      <div>
        <h2 className="t-headline text-[2.4rem]">{title}</h2>
        {detail ? <p className="mt-3 max-w-[38ch] text-[17px] leading-relaxed text-fg/80">{detail}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

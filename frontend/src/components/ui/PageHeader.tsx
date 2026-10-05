import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  action?: ReactNode;
}

/** Page title row: a condensed poster headline and an optional action on the
 * right. The heading carries itself; there is deliberately no eyebrow label. */
export function PageHeader({ title, action }: PageHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-3 border-b-2 border-fg pb-3">
      <h1 className="t-headline min-w-0 text-[2.6rem]">{title}</h1>
      {action ? <div className="flex-none">{action}</div> : null}
    </div>
  );
}

import { ReactNode } from "react";

export const PageHeader = ({
  eyebrow,
  title,
  description,
  actions
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) => (
  <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">{eyebrow}</p>
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">{title}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">{description}</p>
      </div>
    </div>
    {actions ? <div className="flex w-full flex-col gap-3 [&>*]:w-full sm:w-auto sm:flex-row sm:flex-wrap sm:[&>*]:w-auto">{actions}</div> : null}
  </div>
);

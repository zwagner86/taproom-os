import * as React from "react";

import { cn } from "@/lib/cn";

export function PageHeader({
  actions,
  className,
  subtitle,
  title,
}: {
  actions?: React.ReactNode;
  className?: string;
  subtitle?: string;
  title: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-start md:justify-between", className)}>
      <div className="space-y-1">
        <h1 className="font-display text-3xl tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="max-w-3xl text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

import type { ReactNode } from "react";

import { cn } from "../lib/cn";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between mb-7 gap-4", className)}>
      <div>
        <h1 className="text-[22px] font-bold tracking-[-0.5px] mb-1 text-ink">{title}</h1>
        {subtitle && <p className="text-[13.5px] text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}

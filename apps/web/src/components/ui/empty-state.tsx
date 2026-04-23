import * as React from "react";

import { cn } from "@/lib/cn";

import { Card } from "./card";

export function EmptyState({
  action,
  className,
  description,
  icon,
  title,
}: {
  action?: React.ReactNode;
  className?: string;
  description?: string;
  icon?: React.ReactNode;
  title: string;
}) {
  return (
    <Card className={cn("border-dashed bg-card/90", className)}>
      <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
        {icon && <div className="text-muted-foreground">{icon}</div>}
        <div className="space-y-1">
          <div className="text-base font-semibold text-foreground">{title}</div>
          {description && <div className="max-w-md text-sm leading-relaxed text-muted-foreground">{description}</div>}
        </div>
        {action}
      </div>
    </Card>
  );
}

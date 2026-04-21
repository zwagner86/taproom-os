import type { ReactNode } from "react";

import { cn } from "../lib/cn";
import { Card } from "./card";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <Card className={className}>
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        {icon && <div className="text-[36px] leading-none">{icon}</div>}
        <div className="font-semibold text-[15px] text-ink">{title}</div>
        {description && (
          <div className="text-[13.5px] max-w-xs leading-relaxed text-muted">{description}</div>
        )}
        {action}
      </div>
    </Card>
  );
}

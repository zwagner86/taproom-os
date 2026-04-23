import * as React from "react";

import { cn } from "@/lib/cn";

export function Card({ className, style, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-2xl border border-border bg-card text-card-foreground shadow-sm", className)}
      style={{ padding: 24, ...style }}
      {...props}
    />
  );
}

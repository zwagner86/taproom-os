import type { HTMLAttributes } from "react";

import { cn } from "../lib/cn";

export function Card({ className, style, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-rim shadow-panel",
        className,
      )}
      style={{ padding: 24, ...style }}
      {...props}
    />
  );
}

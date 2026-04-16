import type { LabelHTMLAttributes } from "react";

import { cn } from "../lib/cn";

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("text-sm font-semibold text-ink/80", className)}
      {...props}
    />
  );
}


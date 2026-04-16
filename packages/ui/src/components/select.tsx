import type { SelectHTMLAttributes } from "react";

import { cn } from "../lib/cn";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "min-h-11 w-full rounded-2xl border border-ink/10 bg-mist/50 px-4 text-sm text-ink focus:border-ember/40 focus:outline-none focus:ring-2 focus:ring-ember/20",
        className,
      )}
      {...props}
    />
  );
}


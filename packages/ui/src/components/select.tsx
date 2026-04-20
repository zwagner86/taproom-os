import type { SelectHTMLAttributes } from "react";

import { cn } from "../lib/cn";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-lg border border-rim bg-white px-3 py-[9px] text-sm text-ink cursor-pointer",
        "focus:border-ember focus:outline-none transition-colors",
        className,
      )}
      {...props}
    />
  );
}

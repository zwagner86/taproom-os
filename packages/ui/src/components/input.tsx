import type { InputHTMLAttributes } from "react";

import { cn } from "../lib/cn";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-lg border border-rim bg-white px-3 py-[9px] text-sm text-ink placeholder:text-muted",
        "focus:border-ember focus:outline-none transition-colors",
        className,
      )}
      {...props}
    />
  );
}

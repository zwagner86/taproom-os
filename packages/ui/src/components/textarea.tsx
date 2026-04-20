import type { TextareaHTMLAttributes } from "react";

import { cn } from "../lib/cn";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-lg border border-rim bg-white px-3 py-[9px] text-sm text-ink placeholder:text-muted resize-vertical",
        "focus:border-ember focus:outline-none transition-colors",
        className,
      )}
      rows={3}
      {...props}
    />
  );
}

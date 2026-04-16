import type { TextareaHTMLAttributes } from "react";

import { cn } from "../lib/cn";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-3xl border border-ink/10 bg-mist/50 px-4 py-3 text-sm text-ink placeholder:text-ink/45 focus:border-ember/40 focus:outline-none focus:ring-2 focus:ring-ember/20",
        className,
      )}
      {...props}
    />
  );
}


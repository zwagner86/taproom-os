import type { HTMLAttributes } from "react";

import { cn } from "../lib/cn";

type BadgeVariant = "default" | "success" | "error" | "warning" | "info" | "accent" | "purple";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const variants: Record<BadgeVariant, string> = {
  default: "bg-mist text-muted border border-rim",
  success: "bg-green-50 text-green-700 border border-green-200",
  error: "bg-red-50 text-red-700 border border-red-200",
  warning: "bg-amber-50 text-amber-700 border border-amber-200",
  info: "bg-blue-50 text-blue-700 border border-blue-200",
  accent: "bg-ember-light text-ember-dark border border-ember",
  purple: "bg-purple-50 text-purple-700 border border-purple-200",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium leading-[1.4]",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

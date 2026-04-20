import type { ReactNode } from "react";

import { cn } from "../lib/cn";

type AlertVariant = "success" | "error" | "warning" | "info";

const variants: Record<AlertVariant, { container: string; icon: string; iconText: string }> = {
  success: {
    container: "bg-green-50 border border-green-200 text-green-800",
    icon: "text-green-700 font-bold",
    iconText: "✓",
  },
  error: {
    container: "bg-red-50 border border-red-200 text-red-800",
    icon: "text-red-700 font-bold",
    iconText: "!",
  },
  warning: {
    container: "bg-amber-50 border border-amber-200 text-amber-800",
    icon: "text-amber-700 font-bold",
    iconText: "⚠",
  },
  info: {
    container: "bg-blue-50 border border-blue-200 text-blue-800",
    icon: "text-blue-700 font-bold",
    iconText: "i",
  },
};

export function Alert({
  variant = "success",
  children,
  onDismiss,
  className,
}: {
  variant?: AlertVariant;
  children: ReactNode;
  onDismiss?: () => void;
  className?: string;
}) {
  const v = variants[variant];
  return (
    <div className={cn("flex items-start gap-2.5 rounded-[10px] px-4 py-3 text-[13.5px] leading-relaxed", v.container, className)}>
      <span className={cn("mt-px min-w-[18px] text-center text-[13px]", v.icon)}>{v.iconText}</span>
      <div className="flex-1">{children}</div>
      {onDismiss && (
        <button
          className="ml-1 cursor-pointer bg-transparent border-none text-current opacity-60 hover:opacity-100 text-lg leading-none p-0"
          onClick={onDismiss}
          type="button"
        >
          ×
        </button>
      )}
    </div>
  );
}

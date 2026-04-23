import * as React from "react";

import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from "lucide-react";

import { cn } from "@/lib/cn";

type AlertVariant = "success" | "error" | "warning" | "info";

const variantClasses: Record<AlertVariant, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  info: "border-sky-200 bg-sky-50 text-sky-800",
};

const variantIcons: Record<AlertVariant, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: TriangleAlert,
  info: Info,
};

export function Alert({
  children,
  className,
  onDismiss,
  variant = "success",
}: {
  children: React.ReactNode;
  className?: string;
  onDismiss?: () => void;
  variant?: AlertVariant;
}) {
  const Icon = variantIcons[variant];

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm leading-relaxed shadow-sm",
        variantClasses[variant],
        className,
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="flex-1">{children}</div>
      {onDismiss && (
        <button
          className="rounded-md p-0.5 opacity-70 transition-opacity hover:opacity-100"
          onClick={onDismiss}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

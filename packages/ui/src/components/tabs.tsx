"use client";

import { cn } from "../lib/cn";

type Tab = { id: string; label: string; count?: number };

export function Tabs({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-0 border-b border-rim mb-6", className)}>
      {tabs.map((t) => (
        <button
          className={cn(
            "bg-transparent border-none cursor-pointer px-4 py-2 text-[13.5px] font-medium border-b-2 -mb-px transition-all font-[inherit]",
            active === t.id
              ? "text-ember border-b-ember font-semibold"
              : "text-muted border-b-transparent",
          )}
          key={t.id}
          onClick={() => onChange(t.id)}
          type="button"
        >
          {t.label}
          {t.count != null && (
            <span
              className={cn(
                "ml-1.5 rounded-full px-1.5 py-0 text-[11px]",
                active === t.id
                  ? "bg-ember-light text-ember-dark"
                  : "bg-mist text-muted",
              )}
            >
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

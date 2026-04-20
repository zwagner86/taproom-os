"use client";

import { cn } from "../lib/cn";

export function Toggle({
  checked,
  onChange,
  label,
  id,
  className,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  id?: string;
  className?: string;
}) {
  return (
    <label
      className={cn("flex items-center gap-2.5 cursor-pointer select-none", className)}
      htmlFor={id}
    >
      <div className="relative w-10 h-[22px] flex-shrink-0">
        <input
          checked={checked}
          className="sr-only"
          id={id}
          onChange={(e) => onChange(e.target.checked)}
          type="checkbox"
        />
        <div
          className={cn(
            "absolute inset-0 rounded-full transition-colors duration-200",
            checked ? "bg-ember" : "bg-rim",
          )}
        />
        <div
          className={cn(
            "absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-[left] duration-200",
            checked ? "left-[21px]" : "left-[3px]",
          )}
        />
      </div>
      {label && <span className="text-[13.5px] text-ink">{label}</span>}
    </label>
  );
}

"use client";

import * as React from "react";

import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "@/lib/cn";

export function Toggle({
  checked,
  className,
  describedBy,
  id,
  label,
  onChange,
}: {
  checked: boolean;
  className?: string;
  describedBy?: string;
  id?: string;
  label?: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={cn("flex items-center gap-3", className)} htmlFor={id}>
      <SwitchPrimitive.Root
        aria-describedby={describedBy}
        checked={checked}
        className="peer inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-transparent bg-muted transition-colors data-[state=checked]:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        id={id}
        onCheckedChange={onChange}
      >
        <SwitchPrimitive.Thumb className="pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0" />
      </SwitchPrimitive.Root>
      {label && <span className="text-sm text-foreground">{label}</span>}
    </label>
  );
}

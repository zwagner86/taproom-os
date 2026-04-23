"use client";

import * as React from "react";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { Info } from "lucide-react";

import { cn } from "@/lib/cn";

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <TooltipPrimitive.Provider delayDuration={120}>{children}</TooltipPrimitive.Provider>;
}

export function Tooltip({
  children,
  content,
}: {
  children: React.ReactNode;
  content: React.ReactNode;
}) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          className="z-50 max-w-64 rounded-xl border border-border bg-popover px-3 py-2 text-xs leading-relaxed text-popover-foreground shadow-xl"
          sideOffset={8}
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-popover" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

export function InfoTooltip({
  className,
  content,
  label = "More information",
}: {
  className?: string;
  content: React.ReactNode;
  label?: string;
}) {
  return (
    <TooltipProvider>
      <Tooltip
        content={content}
      >
        <button
          aria-label={label}
          className={cn("inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background", className)}
          type="button"
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </Tooltip>
    </TooltipProvider>
  );
}

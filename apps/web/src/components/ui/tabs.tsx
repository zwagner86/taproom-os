"use client";

import * as React from "react";

import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/cn";

type Tab = { id: string; label: string; count?: number };

export function Tabs({
  active,
  className,
  onChange,
  tabs,
}: {
  active: string;
  className?: string;
  onChange: (id: string) => void;
  tabs: Tab[];
}) {
  return (
    <TabsPrimitive.Root className={className} onValueChange={onChange} value={active}>
      <TabsPrimitive.List className="inline-flex h-11 items-center rounded-2xl bg-secondary p-1 text-secondary-foreground">
        {tabs.map((tab) => (
          <TabsPrimitive.Trigger
            className={cn(
              "inline-flex min-w-[108px] items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
            )}
            key={tab.id}
            value={tab.id}
          >
            <span>{tab.label}</span>
            {tab.count != null && (
              <span className="rounded-full bg-border px-1.5 py-0 text-[10px] font-semibold text-muted-foreground data-[state=active]:bg-accent">
                {tab.count}
              </span>
            )}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
    </TabsPrimitive.Root>
  );
}

"use client";

import { useOptimistic, useTransition } from "react";

import { Toggle } from "@/components/ui";

export function ItemActiveToggle({
  active,
  action,
}: {
  active: boolean;
  action: (active: boolean) => Promise<void>;
}) {
  const [optimisticActive, setOptimisticActive] = useOptimistic(active);
  const [, startTransition] = useTransition();

  return (
    <Toggle
      checked={optimisticActive}
      onChange={(checked) => {
        startTransition(async () => {
          setOptimisticActive(checked);
          await action(checked);
        });
      }}
    />
  );
}

"use client";

import { useOptimistic, useTransition } from "react";

import { Toggle } from "@/components/ui";

export function ItemActiveToggle({
  active,
  action,
  disabled = false,
}: {
  active: boolean;
  action: (active: boolean) => Promise<void>;
  disabled?: boolean;
}) {
  const [optimisticActive, setOptimisticActive] = useOptimistic(active);
  const [, startTransition] = useTransition();

  return (
    <Toggle
      checked={optimisticActive}
      disabled={disabled}
      onChange={(checked) => {
        if (disabled) {
          return;
        }

        startTransition(async () => {
          setOptimisticActive(checked);
          await action(checked);
        });
      }}
    />
  );
}

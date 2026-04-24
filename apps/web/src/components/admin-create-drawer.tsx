"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import { Plus } from "lucide-react";

import { Button, Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui";

type DrawerControls = {
  close: () => void;
};

type ButtonProps = Parameters<typeof Button>[0];

type AdminFormDrawerProps = {
  children: ReactNode | ((controls: DrawerControls) => ReactNode);
  description?: string;
  title: string;
  triggerDisabled?: boolean;
  triggerIcon?: ReactNode;
  triggerLabel: string;
  triggerSize?: ButtonProps["size"];
  triggerVariant?: ButtonProps["variant"];
};

export function AdminFormDrawer({
  children,
  description,
  title,
  triggerDisabled = false,
  triggerIcon,
  triggerLabel,
  triggerSize,
  triggerVariant,
}: AdminFormDrawerProps) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const resolvedTriggerIcon = triggerIcon === undefined ? <Plus className="h-4 w-4" /> : triggerIcon;

  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <Button disabled={triggerDisabled} onClick={() => setOpen(true)} size={triggerSize} type="button" variant={triggerVariant}>
        {resolvedTriggerIcon}
        {triggerLabel}
      </Button>
      <SheetContent
        aria-label={title}
        className="w-full overflow-hidden border-l-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(247,244,240,0.99))] p-0 sm:max-w-[min(100vw,560px)]"
        hideClose
        side="right"
      >
        <div className="border-b px-5 py-4 md:px-6" style={{ borderColor: "var(--c-border)" }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <SheetTitle className="font-sans text-[18px] font-semibold tracking-[-0.02em]" style={{ color: "var(--c-text)" }}>
                {title}
              </SheetTitle>
              {description && (
                <SheetDescription className="mt-1 max-w-[36rem] text-[13px] leading-relaxed" style={{ color: "var(--c-muted)" }}>
                  {description}
                </SheetDescription>
              )}
            </div>
            <Button onClick={close} size="sm" type="button" variant="secondary">
              Close
            </Button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-6 md:py-6">
          {typeof children === "function" ? children({ close }) : children}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function AdminCreateDrawer(props: AdminFormDrawerProps) {
  return <AdminFormDrawer {...props} />;
}

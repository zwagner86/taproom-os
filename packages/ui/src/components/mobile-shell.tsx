import type { PropsWithChildren, ReactNode } from "react";

import { cn } from "../lib/cn";

type MobileShellProps = PropsWithChildren<{
  sidebar?: ReactNode;
  className?: string;
}>;

export function MobileShell({ children, sidebar, className }: MobileShellProps) {
  return (
    <div className={cn("flex h-screen overflow-hidden bg-parchment", className)}>
      {sidebar}
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-7">{children}</main>
      </div>
    </div>
  );
}

import type { PropsWithChildren, ReactNode } from "react";

import { cn } from "../lib/cn";

type MobileShellProps = PropsWithChildren<{
  sidebar?: ReactNode;
  className?: string;
}>;

export function MobileShell({ children, sidebar, className }: MobileShellProps) {
  return (
    <div className={cn("mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row lg:px-8", className)}>
      {sidebar ? <aside className="w-full lg:max-w-xs">{sidebar}</aside> : null}
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}


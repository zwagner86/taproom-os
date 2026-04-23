import * as React from "react";

import { cn } from "@/lib/cn";

export function FieldHint({
  children,
  className,
  id,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  if (!children) {
    return null;
  }

  return (
    <p
      className={cn("text-xs leading-relaxed text-muted-foreground", className)}
      id={id}
      {...props}
    >
      {children}
    </p>
  );
}

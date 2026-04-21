import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "../lib/cn";

export function FieldHint({
  children,
  className,
  id,
  ...props
}: HTMLAttributes<HTMLParagraphElement> & {
  children?: ReactNode;
}) {
  if (!children) {
    return null;
  }

  return (
    <p
      className={cn("text-[12px] leading-relaxed text-muted", className)}
      id={id}
      {...props}
    >
      {children}
    </p>
  );
}

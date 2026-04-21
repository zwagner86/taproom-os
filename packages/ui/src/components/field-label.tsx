import type { ReactNode } from "react";

import { cn } from "../lib/cn";
import { InfoTooltip } from "./info-tooltip";
import { Label } from "./label";

export function FieldLabel({
  children,
  className,
  htmlFor,
  info,
  infoLabel,
  required = false,
}: {
  children: ReactNode;
  className?: string;
  htmlFor?: string;
  info?: ReactNode;
  infoLabel?: string;
  required?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Label htmlFor={htmlFor}>
        {children}
        {required && <span style={{ color: "var(--accent)" }}> *</span>}
      </Label>
      {info && <InfoTooltip content={info} label={infoLabel ?? `More information about ${String(children)}`} />}
    </div>
  );
}

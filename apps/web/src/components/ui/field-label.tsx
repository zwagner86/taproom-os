import * as React from "react";

import { cn } from "@/lib/cn";

import { Label } from "./label";
import { InfoTooltip } from "./tooltip";

export function FieldLabel({
  children,
  className,
  htmlFor,
  info,
  infoLabel,
  required = false,
}: {
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
  info?: React.ReactNode;
  infoLabel?: string;
  required?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Label htmlFor={htmlFor}>
        {children}
        {required && <span className="text-primary"> *</span>}
      </Label>
      {info && <InfoTooltip content={info} label={infoLabel ?? `More information about ${String(children)}`} />}
    </div>
  );
}

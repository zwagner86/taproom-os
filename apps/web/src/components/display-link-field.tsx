"use client";

import { useState } from "react";

import { Button, Input, Textarea } from "@taproom/ui";

export function DisplayLinkField({
  copyLabel,
  label,
  multiline = false,
  value,
}: {
  copyLabel?: string;
  label: string;
  multiline?: boolean;
  value: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyValue() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--c-muted)" }}>
        {label}
      </div>
      <div className={multiline ? "flex flex-col gap-2" : "flex gap-2"}>
        {multiline ? (
          <Textarea className="min-h-[88px] rounded-[14px] border-rim bg-[var(--c-bg2)] font-mono text-[11.5px] shadow-none" readOnly value={value} />
        ) : (
          <Input className="rounded-[14px] border-rim bg-[var(--c-bg2)] font-mono text-[11.5px] shadow-none" readOnly value={value} />
        )}
        <Button
          className={multiline ? "w-full" : "shrink-0"}
          onClick={copyValue}
          size="sm"
          type="button"
          variant="secondary"
        >
          {copied ? "Copied" : copyLabel ?? (multiline ? "Copy code" : "Copy")}
        </Button>
      </div>
    </div>
  );
}

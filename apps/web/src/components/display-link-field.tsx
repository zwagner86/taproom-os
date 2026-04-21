"use client";

import { useState } from "react";

import { Button, Input, Textarea } from "@taproom/ui";

export function DisplayLinkField({
  label,
  multiline = false,
  value,
}: {
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
      <div className="flex gap-2">
        {multiline ? (
          <Textarea className="min-h-[92px] font-mono text-[12px]" readOnly value={value} />
        ) : (
          <Input className="font-mono text-[12px]" readOnly value={value} />
        )}
        <Button onClick={copyValue} type="button" variant="secondary">
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
  );
}

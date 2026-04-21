"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import { FieldHint, FieldLabel } from "@taproom/ui";

type DateTimeFieldProps = {
  defaultValue?: string;
  hint?: string;
  info?: ReactNode;
  label: string;
  name: string;
  required?: boolean;
};

const inputClass =
  "flex-1 rounded-lg border border-rim bg-white px-3 py-[9px] text-sm text-ink placeholder:text-muted focus:border-ember focus:outline-none transition-colors min-w-0";

export function DateTimeField({ defaultValue, hint, info, label, name, required }: DateTimeFieldProps) {
  const [date, setDate] = useState(defaultValue?.slice(0, 10) ?? "");
  const [time, setTime] = useState(defaultValue?.slice(11, 16) ?? "");
  const combined = date && time ? `${date}T${time}` : "";
  const hintId = hint ? `${name}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1">
      <FieldLabel htmlFor={`${name}-date`} info={info} required={required}>
        {label}
      </FieldLabel>
      <div className="flex gap-2">
        <input
          aria-label={`${label} date`}
          aria-describedby={hintId}
          className={inputClass}
          id={`${name}-date`}
          onChange={(e) => setDate(e.target.value)}
          type="date"
          value={date}
        />
        <input
          aria-label={`${label} time`}
          aria-describedby={hintId}
          className={inputClass}
          id={`${name}-time`}
          onChange={(e) => setTime(e.target.value)}
          style={{ maxWidth: 130 }}
          type="time"
          value={time}
        />
      </div>
      <FieldHint id={hintId}>{hint}</FieldHint>
      <input name={name} required={required} type="hidden" value={combined} />
    </div>
  );
}

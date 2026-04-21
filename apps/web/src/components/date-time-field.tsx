"use client";

import { useState } from "react";

import { Label } from "@taproom/ui";

type DateTimeFieldProps = {
  name: string;
  label: string;
  defaultValue?: string;
  required?: boolean;
};

const inputClass =
  "flex-1 rounded-lg border border-rim bg-white px-3 py-[9px] text-sm text-ink placeholder:text-muted focus:border-ember focus:outline-none transition-colors min-w-0";

export function DateTimeField({ defaultValue, label, name, required }: DateTimeFieldProps) {
  const [date, setDate] = useState(defaultValue?.slice(0, 10) ?? "");
  const [time, setTime] = useState(defaultValue?.slice(11, 16) ?? "");
  const combined = date && time ? `${date}T${time}` : "";

  return (
    <div className="flex flex-col gap-1">
      <Label>
        {label}
        {required && <span style={{ color: "var(--accent)" }}> *</span>}
      </Label>
      <div className="flex gap-2">
        <input
          aria-label={`${label} date`}
          className={inputClass}
          onChange={(e) => setDate(e.target.value)}
          type="date"
          value={date}
        />
        <input
          aria-label={`${label} time`}
          className={inputClass}
          onChange={(e) => setTime(e.target.value)}
          style={{ maxWidth: 130 }}
          type="time"
          value={time}
        />
      </div>
      <input name={name} required={required} type="hidden" value={combined} />
    </div>
  );
}

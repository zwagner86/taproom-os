"use client";

import { useState } from "react";

import { FieldHint, FieldLabel, Input } from "@taproom/ui";

const ACCENT_PRESETS = [
  { label: "Amber", value: "oklch(62% 0.18 65)" },
  { label: "Slate Blue", value: "oklch(55% 0.14 240)" },
  { label: "Forest", value: "oklch(52% 0.14 155)" },
  { label: "Crimson", value: "oklch(52% 0.18 20)" },
  { label: "Violet", value: "oklch(55% 0.18 300)" },
  { label: "Teal", value: "oklch(58% 0.15 195)" },
];

type AccentPresetPickerProps = {
  defaultValue?: string;
};

export function AccentPresetPicker({ defaultValue }: AccentPresetPickerProps) {
  const [value, setValue] = useState(defaultValue ?? "");
  const presetsHintId = "accent-presets-hint";
  const colorHintId = "accent-color-hint";

  return (
    <>
      <div>
        <FieldLabel info="Presets give you a quick starting point for buttons, badges, links, and other accent treatments across the admin and public surfaces.">
          Accent color presets
        </FieldLabel>
        <div className="flex gap-2 flex-wrap mt-2">
          {ACCENT_PRESETS.map((preset) => {
            const isSelected = value === preset.value;
            return (
              <button
                aria-label={preset.label}
                key={preset.value}
                onClick={() => setValue(preset.value)}
                style={{
                  width: 36,
                  height: 36,
                  background: preset.value,
                  borderRadius: 8,
                  border: isSelected ? "3px solid var(--c-text)" : "2px solid transparent",
                  outline: isSelected ? "2px solid white" : "2px solid transparent",
                  outlineOffset: -4,
                  cursor: "pointer",
                  padding: 0,
                  transition: "outline 0.1s, border 0.1s",
                }}
                title={preset.label}
                type="button"
              />
            );
          })}
        </div>
        <FieldHint id={presetsHintId}>
          Pick a preset to populate the color field below with a reusable brand accent.
        </FieldHint>
      </div>
      <div className="flex flex-col gap-1">
        <FieldLabel
          htmlFor="accent_color"
          info="Enter a valid CSS color string. The app currently stores and previews OKLCH values, so using the presets is the safest option."
        >
          Accent color
        </FieldLabel>
        <Input
          aria-describedby={colorHintId}
          id="accent_color"
          name="accent_color"
          onChange={(e) => setValue(e.target.value)}
          placeholder="oklch(62% 0.18 65)"
          value={value}
        />
        <FieldHint id={colorHintId}>
          This color drives the primary highlight color across venue admin and public views.
        </FieldHint>
      </div>
    </>
  );
}

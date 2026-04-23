"use client";

import { useState } from "react";

import { FieldHint, FieldLabel, Input } from "@/components/ui";

import { normalizeHexColor } from "@/lib/colors";

const ACCENT_PRESETS = [
  { label: "Amber", value: "#C96B2C" },
  { label: "Slate Blue", value: "#5A6ACF" },
  { label: "Forest", value: "#2E8B57" },
  { label: "Crimson", value: "#B33A3A" },
  { label: "Violet", value: "#7C4DCC" },
  { label: "Teal", value: "#2E9F9A" },
];

const DEFAULT_ACCENT_COLOR = "#C96B2C";

type AccentPresetPickerProps = {
  defaultValue?: string;
};

export function AccentPresetPicker({ defaultValue }: AccentPresetPickerProps) {
  const [value, setValue] = useState(normalizeHexColor(defaultValue) ?? DEFAULT_ACCENT_COLOR);
  const presetsHintId = "accent-presets-hint";
  const colorHintId = "accent-color-hint";
  const normalizedValue = normalizeHexColor(value) ?? DEFAULT_ACCENT_COLOR;

  return (
    <>
      <div>
        <FieldLabel info="Presets give you a quick starting point for buttons, badges, links, and other accent treatments across the admin and public surfaces.">
          Accent color presets
        </FieldLabel>
        <div className="flex gap-2 flex-wrap mt-2">
          {ACCENT_PRESETS.map((preset) => {
            const isSelected = normalizedValue === preset.value;
            return (
              <button
                aria-label={preset.label}
                aria-pressed={isSelected}
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
          Pick a preset to populate the hex color field below with a reusable brand accent.
        </FieldHint>
      </div>
      <div className="flex flex-col gap-1">
        <FieldLabel
          htmlFor="accent_color"
          info="Use a 6-digit hex color. The presets and color picker keep the saved value compatible with the database constraint."
        >
          Accent color
        </FieldLabel>
        <div className="flex items-center gap-3">
          <Input
            aria-label="Accent color picker"
            className="h-11 w-16 cursor-pointer p-1"
            onChange={(e) => setValue(normalizeHexColor(e.target.value) ?? DEFAULT_ACCENT_COLOR)}
            type="color"
            value={normalizedValue}
          />
          <Input
            aria-describedby={colorHintId}
            autoCapitalize="off"
            autoCorrect="off"
            className="font-mono uppercase"
            id="accent_color"
            inputMode="text"
            maxLength={7}
            name="accent_color"
            onChange={(e) => setValue(e.target.value.toUpperCase())}
            pattern="#[0-9A-Fa-f]{3}([0-9A-Fa-f]{3})?"
            placeholder="#C96B2C"
            spellCheck={false}
            value={value}
          />
        </div>
        <FieldHint id={colorHintId}>
          This color drives the primary highlight color across venue admin and public views. Example: `#C96B2C`.
        </FieldHint>
      </div>
    </>
  );
}

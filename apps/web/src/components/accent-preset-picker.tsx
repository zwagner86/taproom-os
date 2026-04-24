"use client";

import { useState } from "react";

import { FieldHint, FieldLabel, Input, Select } from "@/components/ui";

import { extractPaletteFromPixels, normalizeHexColor } from "@/lib/colors";

const ACCENT_PRESETS = [
  { label: "Amber", value: "#C96B2C" },
  { label: "Slate Blue", value: "#5A6ACF" },
  { label: "Forest", value: "#2E8B57" },
  { label: "Crimson", value: "#B33A3A" },
  { label: "Violet", value: "#7C4DCC" },
  { label: "Teal", value: "#2E9F9A" },
];

const DEFAULT_ACCENT_COLOR = "#C96B2C";
const DEFAULT_SECONDARY_ACCENT_COLOR = "#2E9F9A";

type AccentPresetPickerProps = {
  defaultValue?: string;
  defaultSecondaryValue?: string;
  defaultTheme?: string;
  logoUrl?: string | null;
};

export function AccentPresetPicker({
  defaultSecondaryValue,
  defaultTheme,
  defaultValue,
  logoUrl,
}: AccentPresetPickerProps) {
  const [primaryValue, setPrimaryValue] = useState(normalizeHexColor(defaultValue) ?? DEFAULT_ACCENT_COLOR);
  const [secondaryValue, setSecondaryValue] = useState(normalizeHexColor(defaultSecondaryValue) ?? DEFAULT_SECONDARY_ACCENT_COLOR);
  const [theme, setTheme] = useState(defaultTheme === "dark" ? "dark" : "light");
  const [palette, setPalette] = useState<string[]>([]);
  const [paletteError, setPaletteError] = useState<string | null>(null);
  const presetsHintId = "accent-presets-hint";
  const primaryColorHintId = "primary-accent-color-hint";
  const secondaryColorHintId = "secondary-accent-color-hint";
  const logoHintId = "logo-upload-hint";
  const themeHintId = "display-theme-hint";
  const normalizedPrimaryValue = normalizeHexColor(primaryValue) ?? DEFAULT_ACCENT_COLOR;

  return (
    <>
      <div className="grid gap-4 md:grid-cols-[auto_minmax(0,1fr)] md:items-start">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt="Current venue logo"
            className="h-20 w-20 rounded-2xl border border-border/70 bg-white object-cover"
            src={logoUrl}
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-dashed border-border bg-secondary text-xs font-semibold text-muted-foreground">
            Logo
          </div>
        )}
        <div className="flex flex-col gap-1">
          <FieldLabel
            htmlFor="logo_file"
            info="Upload a logo to store it with the venue and suggest brand accent colors from the image."
          >
            Logo upload
          </FieldLabel>
          <Input
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            aria-describedby={logoHintId}
            id="logo_file"
            name="logo_file"
            onChange={(event) => {
              const file = event.target.files?.[0];

              if (file) {
                void extractPaletteFromFile(file, setPalette, setPaletteError);
              } else {
                setPalette([]);
                setPaletteError(null);
              }
            }}
            type="file"
          />
          <FieldHint id={logoHintId}>
            Upload a JPG, PNG, WebP, GIF, or SVG logo. Raster logos can suggest brand colors before you save.
          </FieldHint>
          {paletteError && <FieldHint>{paletteError}</FieldHint>}
        </div>
      </div>

      {palette.length > 0 && (
        <div>
          <FieldLabel>Suggested colors from logo</FieldLabel>
          <div className="mt-2 flex flex-wrap gap-2">
            {palette.map((color) => (
              <button
                aria-label={`Use ${color}`}
                className="h-9 min-w-20 rounded-lg border border-border px-2 text-xs font-semibold"
                key={color}
                onClick={() => setPrimaryValue(color)}
                style={{ background: color, color: getReadableTextColor(color) }}
                title={`Use ${color} as primary accent`}
                type="button"
              >
                {color}
              </button>
            ))}
          </div>
          <FieldHint>Click a swatch to use it as the primary accent, or copy it into the secondary accent field.</FieldHint>
        </div>
      )}

      <div>
        <FieldLabel info="Presets give you a quick starting point for buttons, badges, links, and other accent treatments across admin and public surfaces.">
          Brand color presets
        </FieldLabel>
        <div className="flex gap-2 flex-wrap mt-2">
          {ACCENT_PRESETS.map((preset) => {
            const isSelected = normalizedPrimaryValue === preset.value;
            return (
              <button
                aria-label={preset.label}
                aria-pressed={isSelected}
                key={preset.value}
                onClick={() => setPrimaryValue(preset.value)}
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
          Pick a preset to populate the primary accent field below.
        </FieldHint>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <BrandColorField
          hint="Primary controls buttons, links, headers, and the strongest display accents."
          hintId={primaryColorHintId}
          id="accent_color"
          label="Primary accent"
          name="accent_color"
          onChange={setPrimaryValue}
          value={primaryValue}
        />
        <BrandColorField
          hint="Secondary adds contrast for supporting highlights and generated dark/light themes."
          hintId={secondaryColorHintId}
          id="secondary_accent_color"
          label="Secondary accent"
          name="secondary_accent_color"
          onChange={setSecondaryValue}
          value={secondaryValue}
        />
      </div>

      <div className="flex flex-col gap-1">
        <FieldLabel htmlFor="display_theme">Default display theme</FieldLabel>
        <Select
          aria-describedby={themeHintId}
          id="display_theme"
          name="display_theme"
          onChange={(event) => setTheme(event.target.value)}
          value={theme}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </Select>
        <FieldHint id={themeHintId}>
          Displays can use this venue default or override it in Display Management.
        </FieldHint>
      </div>
    </>
  );
}

function BrandColorField({
  hint,
  hintId,
  id,
  label,
  name,
  onChange,
  value,
}: {
  hint: string;
  hintId: string;
  id: string;
  label: string;
  name: string;
  onChange: (value: string) => void;
  value: string;
}) {
  const normalizedValue = normalizeHexColor(value) ?? DEFAULT_ACCENT_COLOR;

  return (
    <div className="flex flex-col gap-1">
      <FieldLabel
        htmlFor={id}
        info="Use a 6-digit hex color. The color picker keeps the saved value compatible with database constraints."
      >
        {label}
      </FieldLabel>
      <div className="flex items-center gap-3">
        <Input
          aria-label={`${label} picker`}
          className="h-11 w-16 cursor-pointer p-1"
          onChange={(event) => onChange(normalizeHexColor(event.target.value) ?? DEFAULT_ACCENT_COLOR)}
          type="color"
          value={normalizedValue}
        />
        <Input
          aria-describedby={hintId}
          autoCapitalize="off"
          autoCorrect="off"
          className="font-mono uppercase"
          id={id}
          inputMode="text"
          maxLength={7}
          name={name}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          pattern="#[0-9A-Fa-f]{3}([0-9A-Fa-f]{3})?"
          placeholder={normalizedValue}
          spellCheck={false}
          value={value}
        />
      </div>
      <FieldHint id={hintId}>{hint}</FieldHint>
    </div>
  );
}

async function extractPaletteFromFile(
  file: File,
  setPalette: (palette: string[]) => void,
  setPaletteError: (error: string | null) => void,
) {
  if (file.type === "image/svg+xml") {
    setPalette([]);
    setPaletteError("SVG logos can be uploaded, but color suggestions work best with raster images.");
    return;
  }

  try {
    const image = await loadImage(file);
    const canvas = document.createElement("canvas");
    const size = 96;
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d", { willReadFrequently: true });

    if (!context) {
      throw new Error("Canvas is unavailable.");
    }

    context.clearRect(0, 0, size, size);
    context.drawImage(image, 0, 0, size, size);
    const imageData = context.getImageData(0, 0, size, size);
    const nextPalette = extractPaletteFromPixels(imageData.data, { maxColors: 6, sampleStride: 16 });

    setPalette(nextPalette);
    setPaletteError(null);
  } catch {
    setPalette([]);
    setPaletteError("Unable to read logo colors from this file.");
  }
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unable to load image."));
    };
    image.src = url;
  });
}

function getReadableTextColor(hex: string) {
  const normalized = normalizeHexColor(hex);

  if (!normalized) {
    return "#111111";
  }

  const red = Number.parseInt(normalized.slice(1, 3), 16);
  const green = Number.parseInt(normalized.slice(3, 5), 16);
  const blue = Number.parseInt(normalized.slice(5, 7), 16);
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;

  return luminance > 0.58 ? "#111111" : "#FFFFFF";
}

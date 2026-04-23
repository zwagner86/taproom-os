const HEX_COLOR_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

export function normalizeHexColor(value: string | null | undefined) {
  const normalized = String(value ?? "").trim();

  if (!HEX_COLOR_PATTERN.test(normalized)) {
    return null;
  }

  const hex = normalized.slice(1).toUpperCase();

  if (hex.length === 3) {
    return `#${hex
      .split("")
      .map((character) => `${character}${character}`)
      .join("")}`;
  }

  return `#${hex}`;
}

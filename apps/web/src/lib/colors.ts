const HEX_COLOR_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
const DEFAULT_PALETTE = ["#C96B2C", "#2E9F9A", "#5A6ACF"];

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

export function rgbToHex(red: number, green: number, blue: number) {
  return `#${[red, green, blue]
    .map((channel) => clampColorChannel(channel).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

export function extractPaletteFromPixels(
  pixels: ArrayLike<number>,
  options: {
    fallback?: string[];
    maxColors?: number;
    sampleStride?: number;
  } = {},
) {
  const fallback = normalizePalette(options.fallback ?? DEFAULT_PALETTE);
  const maxColors = options.maxColors ?? 6;
  const sampleStride = Math.max(4, (options.sampleStride ?? 16) - ((options.sampleStride ?? 16) % 4));
  const buckets = new Map<string, { count: number; red: number; green: number; blue: number; score: number }>();

  for (let index = 0; index < pixels.length; index += sampleStride) {
    const red = Number(pixels[index]);
    const green = Number(pixels[index + 1]);
    const blue = Number(pixels[index + 2]);
    const alpha = Number(pixels[index + 3] ?? 255);

    if (alpha < 128 || isNaN(red) || isNaN(green) || isNaN(blue) || shouldSkipPaletteColor(red, green, blue)) {
      continue;
    }

    const bucketRed = quantizeChannel(red);
    const bucketGreen = quantizeChannel(green);
    const bucketBlue = quantizeChannel(blue);
    const key = `${bucketRed}-${bucketGreen}-${bucketBlue}`;
    const saturation = getSaturation(red, green, blue);
    const luminance = getRelativeLuminance(red, green, blue);
    const balance = 1 - Math.abs(luminance - 0.52);
    const score = saturation * Math.max(0.35, balance);
    const current = buckets.get(key);

    if (current) {
      current.count += 1;
      current.red += red;
      current.green += green;
      current.blue += blue;
      current.score += score;
    } else {
      buckets.set(key, { blue, count: 1, green, red, score });
    }
  }

  const ranked = [...buckets.values()]
    .map((bucket) => ({
      hex: rgbToHex(bucket.red / bucket.count, bucket.green / bucket.count, bucket.blue / bucket.count),
      score: bucket.count * bucket.score,
    }))
    .sort((left, right) => right.score - left.score);

  const palette: string[] = [];

  for (const candidate of ranked) {
    if (palette.every((existing) => getHexDistance(existing, candidate.hex) >= 42)) {
      palette.push(candidate.hex);
    }

    if (palette.length >= maxColors) {
      break;
    }
  }

  return palette.length > 0 ? palette : fallback.slice(0, maxColors);
}

function normalizePalette(colors: string[]) {
  return colors.map((color) => normalizeHexColor(color)).filter((color): color is string => Boolean(color));
}

function clampColorChannel(value: number) {
  return Math.min(255, Math.max(0, Math.round(value)));
}

function quantizeChannel(value: number) {
  return Math.min(255, Math.max(0, Math.round(value / 32) * 32));
}

function shouldSkipPaletteColor(red: number, green: number, blue: number) {
  const luminance = getRelativeLuminance(red, green, blue);
  const saturation = getSaturation(red, green, blue);

  return luminance < 0.08 || luminance > 0.94 || saturation < 0.12;
}

function getSaturation(red: number, green: number, blue: number) {
  const channels = [red, green, blue].map((channel) => channel / 255);
  const max = Math.max(...channels);
  const min = Math.min(...channels);

  return max === 0 ? 0 : (max - min) / max;
}

function getRelativeLuminance(red: number, green: number, blue: number) {
  const channels = [red, green, blue].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const r = channels[0] ?? 0;
  const g = channels[1] ?? 0;
  const b = channels[2] ?? 0;

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getHexDistance(left: string, right: string) {
  const leftRgb = hexToRgb(left);
  const rightRgb = hexToRgb(right);

  if (!leftRgb || !rightRgb) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.sqrt(
    (leftRgb.red - rightRgb.red) ** 2 +
    (leftRgb.green - rightRgb.green) ** 2 +
    (leftRgb.blue - rightRgb.blue) ** 2,
  );
}

function hexToRgb(value: string) {
  const normalized = normalizeHexColor(value);

  if (!normalized) {
    return null;
  }

  return {
    blue: Number.parseInt(normalized.slice(5, 7), 16),
    green: Number.parseInt(normalized.slice(3, 5), 16),
    red: Number.parseInt(normalized.slice(1, 3), 16),
  };
}

import { describe, expect, it } from "vitest";

import { extractPaletteFromPixels, normalizeHexColor, rgbToHex } from "./colors";

describe("color helpers", () => {
  it("normalizes 6-digit hex colors to uppercase", () => {
    expect(normalizeHexColor("#c96b2c")).toBe("#C96B2C");
  });

  it("expands 3-digit hex colors", () => {
    expect(normalizeHexColor("#abc")).toBe("#AABBCC");
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeHexColor("  #2e9f9a  ")).toBe("#2E9F9A");
  });

  it("rejects non-hex color strings", () => {
    expect(normalizeHexColor("oklch(62% 0.18 65)")).toBeNull();
    expect(normalizeHexColor("amber")).toBeNull();
  });

  it("converts rgb channels to normalized hex", () => {
    expect(rgbToHex(201, 107, 44)).toBe("#C96B2C");
    expect(rgbToHex(300, -2, 44.4)).toBe("#FF002C");
  });

  it("extracts palette colors while filtering transparent, near-white, and near-black pixels", () => {
    const pixels = new Uint8ClampedArray([
      255, 255, 255, 255,
      0, 0, 0, 255,
      201, 107, 44, 255,
      202, 108, 45, 255,
      46, 159, 154, 255,
      90, 106, 207, 0,
    ]);

    const palette = extractPaletteFromPixels(pixels, { maxColors: 3, sampleStride: 4 });

    expect(palette).toContain("#CA6C2D");
    expect(palette).toContain("#2E9F9A");
    expect(palette).not.toContain("#FFFFFF");
    expect(palette).not.toContain("#000000");
  });

  it("falls back when no useful logo colors are found", () => {
    const pixels = new Uint8ClampedArray([
      255, 255, 255, 255,
      4, 4, 4, 255,
      120, 120, 120, 255,
    ]);

    expect(extractPaletteFromPixels(pixels, { fallback: ["#123456"], sampleStride: 4 })).toEqual(["#123456"]);
  });
});

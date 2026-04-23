import { describe, expect, it } from "vitest";

import { normalizeHexColor } from "./colors";

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
});

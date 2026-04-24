import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { VenueSettingsForm } from "./venue-settings-form";

describe("venue settings form", () => {
  it("renders branding controls without menu or membership terminology fields", () => {
    const markup = renderToStaticMarkup(
      createElement(VenueSettingsForm, {
        action: async () => null,
        venue: {
          accent_color: "#C96B2C",
          created_at: "2026-04-01T09:00:00.000Z",
          display_theme: "dark",
          id: "venue-1",
          logo_url: "https://example.com/logo.png",
          membership_label: "Mug Club",
          menu_label: "Tap List",
          name: "Demo Taproom",
          secondary_accent_color: "#2E9F9A",
          slug: "demo-taproom",
          tagline: "Small batch. Big character.",
          updated_at: "2026-04-01T09:00:00.000Z",
          venue_type: "brewery",
        },
      }),
    );

    expect(markup).toContain('name="logo_file"');
    expect(markup).toContain('name="accent_color"');
    expect(markup).toContain('name="secondary_accent_color"');
    expect(markup).toContain('name="display_theme"');
    expect(markup).not.toContain('name="menu_label"');
    expect(markup).not.toContain('name="membership_label"');
  });
});

import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const { mockListPublicVenueItems } = vi.hoisted(() => ({
  mockListPublicVenueItems: vi.fn(),
}));

vi.mock("@/server/repositories/items", () => ({
  listPublicVenueItems: mockListPublicVenueItems,
}));

vi.mock("@/server/repositories/events", () => ({
  listPublicVenueEvents: vi.fn(),
}));

vi.mock("@/server/repositories/memberships", () => ({
  listPublicMembershipPlans: vi.fn(),
}));

vi.mock("@/server/services/payment-capability", () => ({
  getVenuePaymentCapability: vi.fn(),
}));

vi.mock("@/server/actions/memberships", () => ({
  startMembershipCheckoutAction: vi.fn(),
}));

import { getDefaultDisplayViewConfig } from "@/lib/displays";

import { DisplayView } from "./display-view";

afterEach(() => {
  vi.clearAllMocks();
});

describe("display view branding", () => {
  it("uses the venue default dark theme when the display follows venue default", async () => {
    mockListPublicVenueItems.mockResolvedValue({
      items: [],
      venue: makeVenue({ display_theme: "dark" }),
    });

    const markup = renderToStaticMarkup(
      await DisplayView({
        config: getDefaultDisplayViewConfig("public", "menu"),
        venueSlug: "demo-taproom",
      }),
    );

    expect(markup).toContain("--c-bg:oklch(14% 0.02 55)");
    expect(markup).toContain("--accent-secondary:#2E9F9A");
  });

  it("lets display theme override the venue default", async () => {
    mockListPublicVenueItems.mockResolvedValue({
      items: [],
      venue: makeVenue({ display_theme: "dark" }),
    });

    const markup = renderToStaticMarkup(
      await DisplayView({
        config: {
          ...getDefaultDisplayViewConfig("public", "menu"),
          theme: "light",
        },
        venueSlug: "demo-taproom",
      }),
    );

    expect(markup).toContain("--c-bg:oklch(97% 0.008 75)");
  });
});

function makeVenue(overrides = {}) {
  return {
    accent_color: "#C96B2C",
    created_at: "2026-04-01T09:00:00.000Z",
    display_theme: "light",
    id: "venue-1",
    logo_url: null,
    membership_label: "Mug Club",
    menu_label: "Tap List",
    name: "Demo Taproom",
    secondary_accent_color: "#2E9F9A",
    slug: "demo-taproom",
    tagline: "Small batch. Big character.",
    updated_at: "2026-04-01T09:00:00.000Z",
    venue_type: "brewery",
    ...overrides,
  };
}

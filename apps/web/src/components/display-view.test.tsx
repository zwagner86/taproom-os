import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const { mockListPublicMembershipPlans, mockListPublicVenueEvents, mockListPublicVenueItems } = vi.hoisted(() => ({
  mockListPublicMembershipPlans: vi.fn(),
  mockListPublicVenueEvents: vi.fn(),
  mockListPublicVenueItems: vi.fn(),
}));

vi.mock("@/server/repositories/items", () => ({
  listPublicVenueItems: mockListPublicVenueItems,
}));

vi.mock("@/server/repositories/events", () => ({
  listPublicVenueEvents: mockListPublicVenueEvents,
}));

vi.mock("@/server/repositories/memberships", () => ({
  listPublicMembershipPlans: mockListPublicMembershipPlans,
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

describe("display view pagination", () => {
  it("paginates menu items after sorting and preserves represented section labels", async () => {
    mockListPublicVenueItems.mockResolvedValue({
      items: [
        makeItem({ display_order: 10, id: "item-1", name: "First Pour", section: makeSection("section-1", "Regular Beers", 10) }),
        makeItem({ display_order: 20, id: "item-2", name: "Second Pour", section: makeSection("section-1", "Regular Beers", 10) }),
        makeItem({ display_order: 30, id: "item-3", name: "Third Pour", section: makeSection("section-1", "Regular Beers", 10) }),
        makeItem({ display_order: 40, id: "item-4", name: "Seasonal Pour", section: makeSection("section-2", "Seasonal Beers", 20) }),
      ],
      venue: makeVenue(),
    });

    const markup = renderToStaticMarkup(
      await DisplayView({
        config: {
          ...getDefaultDisplayViewConfig("tv", "menu"),
          page: 2,
          pageSize: 2,
        },
        venueSlug: "demo-taproom",
      }),
    );

    expect(markup).not.toContain("First Pour");
    expect(markup).not.toContain("Second Pour");
    expect(markup).toContain("Third Pour");
    expect(markup).toContain("Seasonal Pour");
    expect(markup).toContain("Regular Beers");
    expect(markup).toContain("Seasonal Beers");
    expect(markup).toContain("Page 2 of 2");
  });

  it("leaves unpaginated menu views complete and without a page indicator", async () => {
    mockListPublicVenueItems.mockResolvedValue({
      items: [
        makeItem({ id: "item-1", name: "First Pour" }),
        makeItem({ display_order: 20, id: "item-2", name: "Second Pour" }),
      ],
      venue: makeVenue(),
    });

    const markup = renderToStaticMarkup(
      await DisplayView({
        config: getDefaultDisplayViewConfig("tv", "drinks"),
        venueSlug: "demo-taproom",
      }),
    );

    expect(markup).toContain("First Pour");
    expect(markup).toContain("Second Pour");
    expect(markup).not.toContain("Page 1 of 1");
  });

  it("paginates events", async () => {
    mockListPublicVenueEvents.mockResolvedValue({
      events: [
        makeEvent({ id: "event-1", title: "First Event" }),
        makeEvent({ id: "event-2", title: "Second Event" }),
      ],
      venue: makeVenue(),
    });

    const markup = renderToStaticMarkup(
      await DisplayView({
        config: {
          ...getDefaultDisplayViewConfig("tv", "events"),
          page: 2,
          pageSize: 1,
        },
        venueSlug: "demo-taproom",
      }),
    );

    expect(markup).not.toContain("First Event");
    expect(markup).toContain("Second Event");
    expect(markup).toContain("Page 2 of 2");
  });

  it("paginates memberships", async () => {
    mockListPublicMembershipPlans.mockResolvedValue({
      plans: [
        makeMembershipPlan({ id: "plan-1", name: "Monthly Club" }),
        makeMembershipPlan({ id: "plan-2", name: "Annual Club" }),
      ],
      venue: makeVenue(),
    });

    const markup = renderToStaticMarkup(
      await DisplayView({
        config: {
          ...getDefaultDisplayViewConfig("tv", "memberships"),
          page: 2,
          pageSize: 1,
        },
        venueSlug: "demo-taproom",
      }),
    );

    expect(markup).not.toContain("Monthly Club");
    expect(markup).toContain("Annual Club");
    expect(markup).toContain("Page 2 of 2");
  });
});

function makeSection(id: string, name: string, displayOrder: number) {
  return {
    active: true,
    created_at: "2026-04-01T09:00:00.000Z",
    description: null,
    display_order: displayOrder,
    id,
    item_type: "pour",
    name,
    updated_at: "2026-04-01T09:00:00.000Z",
    venue_id: "venue-1",
  };
}

function makeItem({
  display_order = 10,
  id,
  name,
  section = makeSection("section-1", "Regular Beers", 10),
}: {
  display_order?: number;
  id: string;
  name: string;
  section?: ReturnType<typeof makeSection>;
}) {
  return {
    abv: 5.1,
    active: true,
    created_at: "2026-04-01T09:00:00.000Z",
    description: `${name} description`,
    display_order,
    id,
    item_external_links: [],
    item_servings: [],
    menu_section_id: section.id,
    menu_sections: section,
    name,
    price_source: "manual",
    producer_location: null,
    producer_name: null,
    status: "active",
    style_or_category: "Pale Ale",
    type: "pour",
    updated_at: "2026-04-01T09:00:00.000Z",
    venue_id: "venue-1",
  };
}

function makeEvent(overrides = {}) {
  return {
    capacity: 50,
    created_at: "2026-04-01T09:00:00.000Z",
    currency: "USD",
    description: null,
    ends_at: "2026-04-03T20:00:00.000Z",
    id: "event-1",
    price_cents: null,
    published: true,
    slug: "event",
    starts_at: "2026-04-03T18:00:00.000Z",
    status: "published",
    title: "Event",
    updated_at: "2026-04-01T09:00:00.000Z",
    venue_id: "venue-1",
    ...overrides,
  };
}

function makeMembershipPlan(overrides = {}) {
  return {
    active: true,
    billing_interval: "month",
    created_at: "2026-04-01T09:00:00.000Z",
    currency: "USD",
    description: null,
    id: "plan-1",
    name: "Membership",
    price_cents: 2500,
    slug: "membership",
    updated_at: "2026-04-01T09:00:00.000Z",
    venue_id: "venue-1",
    ...overrides,
  };
}

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

import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const {
  mockGetEnv,
  mockListVenueEvents,
  mockRequireVenueAccess,
} = vi.hoisted(() => ({
  mockGetEnv: vi.fn(),
  mockListVenueEvents: vi.fn(),
  mockRequireVenueAccess: vi.fn(),
}));

vi.mock("@/env", () => ({
  getEnv: mockGetEnv,
}));

vi.mock("@/server/repositories/events", () => ({
  listVenueEvents: mockListVenueEvents,
}));

vi.mock("@/server/repositories/venues", () => ({
  requireVenueAccess: mockRequireVenueAccess,
}));

vi.mock("@/components/share-qr-card", () => ({
  ShareQrCard: ({ destination }: { destination: { label: string; url: string } }) => (
    <article data-share-card={destination.label}>{destination.url}</article>
  ),
}));

import VenueSharePage from "./page";

afterEach(() => {
  vi.clearAllMocks();
});

describe("venue share page", () => {
  it("renders core share destinations and published event cards", async () => {
    mockGetEnv.mockReturnValue({ NEXT_PUBLIC_APP_URL: "https://taproomos.example" });
    mockRequireVenueAccess.mockResolvedValue({
      venue: {
        id: "venue-1",
        name: "Demo Taproom",
      },
    });
    mockListVenueEvents.mockResolvedValue([
      {
        id: "event-1",
        published: true,
        starts_at: "2026-05-01T19:00:00.000Z",
        status: "published",
        title: "Trivia Night",
      },
      {
        id: "event-2",
        published: false,
        starts_at: "2026-05-02T19:00:00.000Z",
        status: "draft",
        title: "Draft Event",
      },
    ]);

    const markup = renderToStaticMarkup(
      await VenueSharePage({
        params: Promise.resolve({ venue: "demo-taproom" }),
      }),
    );

    expect(markup).toContain("Share &amp; QR");
    expect(markup).toContain("https://taproomos.example/v/demo-taproom/menu");
    expect(markup).toContain("https://taproomos.example/v/demo-taproom/events");
    expect(markup).toContain("https://taproomos.example/v/demo-taproom/memberships");
    expect(markup).toContain("https://taproomos.example/v/demo-taproom/follow");
    expect(markup).toContain("https://taproomos.example/v/demo-taproom/events/event-1");
    expect(markup).not.toContain("Draft Event");
  });
});

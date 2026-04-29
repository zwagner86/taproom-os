import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const {
  mockGetEnv,
  mockGetVenueEventById,
  mockRequireVenueAccess,
} = vi.hoisted(() => ({
  mockGetEnv: vi.fn(),
  mockGetVenueEventById: vi.fn(),
  mockRequireVenueAccess: vi.fn(),
}));

vi.mock("react-qr-code", () => ({
  default: ({ value }: { value: string }) => <svg data-qr-value={value} />,
}));

vi.mock("@/env", () => ({
  getEnv: mockGetEnv,
}));

vi.mock("@/server/repositories/events", () => ({
  getVenueEventById: mockGetVenueEventById,
}));

vi.mock("@/server/repositories/venues", () => ({
  requireVenueAccess: mockRequireVenueAccess,
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("not-found");
  }),
}));

import SharePrintPage from "./page";

afterEach(() => {
  vi.clearAllMocks();
});

describe("share print page", () => {
  it("renders a branded poster template with QR and attribution", async () => {
    mockGetEnv.mockReturnValue({ NEXT_PUBLIC_APP_URL: "https://taproomos.example" });
    mockRequireVenueAccess.mockResolvedValue({
      venue: {
        accent_color: "#006b5f",
        id: "venue-1",
        logo_url: "https://example.com/logo.png",
        name: "Demo Taproom",
      },
    });

    const markup = renderToStaticMarkup(
      await SharePrintPage({
        params: Promise.resolve({ destination: "menu", venue: "demo-taproom" }),
        searchParams: Promise.resolve({ layout: "poster" }),
      }),
    );

    expect(markup).toContain("Demo Taproom");
    expect(markup).toContain("https://example.com/logo.png");
    expect(markup).toContain("https://taproomos.example/v/demo-taproom/menu");
    expect(markup).toContain("data-qr-value=\"https://taproomos.example/v/demo-taproom/menu\"");
    expect(markup).toContain("Powered by TaproomOS");
    expect(markup).toContain("size: letter portrait");
  });

  it("renders published event templates by event id", async () => {
    mockGetEnv.mockReturnValue({ NEXT_PUBLIC_APP_URL: "https://taproomos.example" });
    mockRequireVenueAccess.mockResolvedValue({
      venue: {
        accent_color: "#C96B2C",
        id: "venue-1",
        logo_url: null,
        name: "Demo Taproom",
      },
    });
    mockGetVenueEventById.mockResolvedValue({
      id: "event-1",
      published: true,
      starts_at: "2026-05-01T19:00:00.000Z",
      status: "published",
      title: "Trivia Night",
    });

    const markup = renderToStaticMarkup(
      await SharePrintPage({
        params: Promise.resolve({ destination: "event-event-1", venue: "demo-taproom" }),
        searchParams: Promise.resolve({ layout: "tent" }),
      }),
    );

    expect(mockGetVenueEventById).toHaveBeenCalledWith("venue-1", "event-1");
    expect(markup).toContain("Trivia Night");
    expect(markup).toContain("https://taproomos.example/v/demo-taproom/events/event-1");
    expect(markup).toContain("size: letter landscape");
    expect(markup.match(/Powered by TaproomOS/g)?.length).toBe(2);
  });
});

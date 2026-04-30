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
  default: ({ size, value }: { size: number; value: string }) => <svg data-qr-size={size} data-qr-value={value} />,
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
  it("renders a branded letter insert with QR and attribution", async () => {
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
        searchParams: Promise.resolve({ layout: "letter" }),
      }),
    );

    expect(markup).toContain("Demo Taproom");
    expect(markup).toContain("https://example.com/logo.png");
    expect(markup).toContain("https://taproomos.example/v/demo-taproom/menu");
    expect(markup).toContain("data-qr-value=\"https://taproomos.example/v/demo-taproom/menu\"");
    expect(markup).toContain("data-qr-size=\"340\"");
    expect(markup).toContain("Powered by TaproomOS");
    expect(markup).toContain("size: 8.5in 11in");
    expect(markup).toContain("height: 11in");
    expect(markup).toContain("width: 8.5in");
    expect(markup.match(/data-qr-value=/g)?.length).toBe(1);
  });

  it("renders half-letter event inserts by event id", async () => {
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
        searchParams: Promise.resolve({ layout: "half-letter" }),
      }),
    );

    expect(mockGetVenueEventById).toHaveBeenCalledWith("venue-1", "event-1");
    expect(markup).toContain("Trivia Night");
    expect(markup).toContain("https://taproomos.example/v/demo-taproom/events/event-1");
    expect(markup).toContain("data-qr-size=\"260\"");
    expect(markup).toContain("size: 8.5in 11in");
    expect(markup).toContain("height: 5.5in");
    expect(markup).toContain("width: 8.5in");
    expect(markup).toContain("height: 8.5in");
    expect(markup).toContain("width: 5.5in");
    expect(markup).toContain("left: 50%");
    expect(markup).toContain("top: 50%");
    expect(markup).toContain("top: 5.5in");
    expect(markup).toContain("transform: translate(-50%, -50%) rotate(90deg)");
    expect(markup).toContain("transform-origin: center");
    expect(markup.match(/data-qr-value=/g)?.length).toBe(2);
    expect(markup.match(/Powered by TaproomOS/g)?.length).toBe(2);
  });

  it("renders 4 x 6 inserts and treats legacy tent links as letter", async () => {
    mockGetEnv.mockReturnValue({ NEXT_PUBLIC_APP_URL: "https://taproomos.example" });
    mockRequireVenueAccess.mockResolvedValue({
      venue: {
        accent_color: "#C96B2C",
        id: "venue-1",
        logo_url: null,
        name: "Demo Taproom",
      },
    });

    const photoMarkup = renderToStaticMarkup(
      await SharePrintPage({
        params: Promise.resolve({ destination: "follow", venue: "demo-taproom" }),
        searchParams: Promise.resolve({ layout: "photo-4x6" }),
      }),
    );
    const legacyMarkup = renderToStaticMarkup(
      await SharePrintPage({
        params: Promise.resolve({ destination: "follow", venue: "demo-taproom" }),
        searchParams: Promise.resolve({ layout: "tent" }),
      }),
    );

    expect(photoMarkup).toContain("size: 8.5in 11in");
    expect(photoMarkup).toContain("height: 6in");
    expect(photoMarkup).toContain("width: 4in");
    expect(photoMarkup).toContain("border: 1px dashed #d8cfc6");
    expect(photoMarkup).toContain("data-qr-size=\"220\"");
    expect(photoMarkup.match(/data-qr-value=/g)?.length).toBe(2);
    expect(legacyMarkup).toContain("size: 8.5in 11in");
  });
});

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

vi.mock("@/env", () => ({
  getEnv: mockGetEnv,
}));

vi.mock("@/server/repositories/events", () => ({
  getVenueEventById: mockGetVenueEventById,
}));

vi.mock("@/server/repositories/venues", () => ({
  requireVenueAccess: mockRequireVenueAccess,
}));

import { GET } from "./route";

afterEach(() => {
  vi.clearAllMocks();
});

describe("share print PDF route", () => {
  it("returns a PDF for core destinations", async () => {
    mockGetEnv.mockReturnValue({ NEXT_PUBLIC_APP_URL: "https://taproomos.example" });
    mockRequireVenueAccess.mockResolvedValue({
      venue: {
        accent_color: "#006b5f",
        id: "venue-1",
        logo_url: null,
        name: "Demo Taproom",
      },
    });

    const response = await GET(new Request("https://taproomos.example/app/demo-taproom/share/print/menu/pdf?layout=half-letter"), {
      params: Promise.resolve({ destination: "menu", venue: "demo-taproom" }),
    });
    const bytes = new Uint8Array(await response.arrayBuffer());

    expect(mockRequireVenueAccess).toHaveBeenCalledWith("demo-taproom");
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toContain("demo-taproom-menu-qr-half-letter.pdf");
    expect(bytes.length).toBeGreaterThan(1000);
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
  });

  it("returns a PDF for published event destinations", async () => {
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

    const response = await GET(
      new Request("https://taproomos.example/app/demo-taproom/share/print/event-event-1/pdf?layout=photo-4x6"),
      {
        params: Promise.resolve({ destination: "event-event-1", venue: "demo-taproom" }),
      },
    );
    const bytes = new Uint8Array(await response.arrayBuffer());

    expect(mockGetVenueEventById).toHaveBeenCalledWith("venue-1", "event-1");
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toContain("demo-taproom-event-event-1-qr-photo-4x6.pdf");
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
  });

  it("returns 404 for unknown destinations", async () => {
    mockGetEnv.mockReturnValue({ NEXT_PUBLIC_APP_URL: "https://taproomos.example" });
    mockRequireVenueAccess.mockResolvedValue({
      venue: {
        accent_color: "#C96B2C",
        id: "venue-1",
        logo_url: null,
        name: "Demo Taproom",
      },
    });

    const response = await GET(new Request("https://taproomos.example/app/demo-taproom/share/print/unknown/pdf"), {
      params: Promise.resolve({ destination: "unknown", venue: "demo-taproom" }),
    });

    expect(response.status).toBe(404);
  });
});

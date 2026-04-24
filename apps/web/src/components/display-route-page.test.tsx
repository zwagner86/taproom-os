import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const {
  mockGetPlaylistBySurfaceAndSlug,
  mockGetVenueBySlug,
  mockGetViewBySurfaceAndSlug,
  mockListVenueDisplayViews,
} = vi.hoisted(() => ({
  mockGetPlaylistBySurfaceAndSlug: vi.fn(),
  mockGetVenueBySlug: vi.fn(),
  mockGetViewBySurfaceAndSlug: vi.fn(),
  mockListVenueDisplayViews: vi.fn(),
}));

vi.mock("@/server/repositories/venues", () => ({
  getVenueBySlug: mockGetVenueBySlug,
}));

vi.mock("@/server/repositories/display-playlists", () => ({
  getVenueDisplayPlaylistBySurfaceAndSlug: mockGetPlaylistBySurfaceAndSlug,
}));

vi.mock("@/server/repositories/display-views", () => ({
  getVenueDisplayViewBySurfaceAndSlug: mockGetViewBySurfaceAndSlug,
  listVenueDisplayViews: mockListVenueDisplayViews,
}));

vi.mock("./display-view", () => ({
  DisplayView: ({
    config,
    venueSlug,
  }: {
    config: { content: string; surface: string; theme?: string };
    venueSlug: string;
  }) => createElement("div", {
    "data-content": config.content,
    "data-surface": config.surface,
    "data-theme": config.theme,
    "data-venue": venueSlug,
  }),
}));

vi.mock("./display-playlist-player", () => ({
  DisplayPlaylistPlayer: ({
    slides,
  }: {
    slides: Array<{ src: string }>;
  }) => createElement("div", {
    "data-slides": slides.map((slide) => slide.src).join("|"),
  }),
}));

import { renderAdHocDisplaySurfacePage, renderSavedDisplaySurfacePage } from "./display-route-page";

afterEach(() => {
  vi.clearAllMocks();
});

describe("display route helpers", () => {
  it("renders ad hoc display routes from query params", async () => {
    mockGetVenueBySlug.mockResolvedValue({ id: "venue-1", name: "Demo Taproom" });

    const markup = renderToStaticMarkup(
      await renderAdHocDisplaySurfacePage({
        searchParams: { content: "events", theme: "dark" },
        surface: "embed",
        venueSlug: "demo-taproom",
      }),
    );

    expect(markup).toContain('data-content="events"');
    expect(markup).toContain('data-surface="embed"');
    expect(markup).toContain('data-theme="dark"');
    expect(markup).toContain('data-venue="demo-taproom"');
  });

  it("resolves saved playlists from view ids within the same surface", async () => {
    mockGetVenueBySlug.mockResolvedValue({ id: "venue-1", name: "Demo Taproom" });
    mockGetPlaylistBySurfaceAndSlug.mockResolvedValue({
      config: {
        slides: [{ durationSeconds: 12, transition: "fade", viewId: "view-tv-1" }],
      },
      id: "playlist-1",
      name: "Rotation",
      slug: "rotation",
      surface: "tv",
    });
    mockGetViewBySurfaceAndSlug.mockResolvedValue(null);
    mockListVenueDisplayViews.mockResolvedValue([
      {
        content: "drinks",
        id: "view-tv-1",
        name: "Tap list TV",
        slug: "tap-list-tv",
        surface: "tv",
      },
    ]);

    const markup = renderToStaticMarkup(
      await renderSavedDisplaySurfacePage({
        displaySlug: "rotation",
        searchParams: {},
        surface: "tv",
        venueSlug: "demo-taproom",
      }),
    );

    expect(markup).toContain('data-slides="/tv/demo-taproom/display/tap-list-tv"');
  });
});

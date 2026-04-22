import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { extractDisplayViewOptions, getDefaultDisplayViewConfig } from "../lib/displays";
import type { DisplayPlaylistRecord } from "../server/repositories/display-playlists";
import type { DisplayViewRecord } from "../server/repositories/display-views";
import { DisplaysWorkspace } from "./displays-workspace";

const publicMenuView: DisplayViewRecord = {
  config: getDefaultDisplayViewConfig("public", "menu"),
  content: "menu",
  created_at: "2026-04-22T12:00:00.000Z",
  id: "view-public-menu",
  name: null,
  options: extractDisplayViewOptions(getDefaultDisplayViewConfig("public", "menu")),
  slug: null,
  surface: "public",
  updated_at: "2026-04-22T12:00:00.000Z",
  venue_id: "venue-1",
};

const tvDrinksView: DisplayViewRecord = {
  config: getDefaultDisplayViewConfig("tv", "drinks"),
  content: "drinks",
  created_at: "2026-04-22T12:05:00.000Z",
  id: "view-tv-drinks",
  name: "Tap list TV",
  options: extractDisplayViewOptions(getDefaultDisplayViewConfig("tv", "drinks")),
  slug: "tap-list-tv",
  surface: "tv",
  updated_at: "2026-04-22T12:05:00.000Z",
  venue_id: "venue-1",
};

const embedEventsView: DisplayViewRecord = {
  config: getDefaultDisplayViewConfig("embed", "events"),
  content: "events",
  created_at: "2026-04-22T12:06:00.000Z",
  id: "view-embed-events",
  name: "Homepage events",
  options: extractDisplayViewOptions(getDefaultDisplayViewConfig("embed", "events")),
  slug: "homepage-events",
  surface: "embed",
  updated_at: "2026-04-22T12:06:00.000Z",
  venue_id: "venue-1",
};

const tvPlaylist: DisplayPlaylistRecord = {
  config: {
    slides: [
      { durationSeconds: 12, transition: "fade", viewId: tvDrinksView.id },
    ],
  },
  created_at: "2026-04-22T12:07:00.000Z",
  id: "playlist-tv",
  name: "Weekend rotation",
  slug: "weekend-rotation",
  surface: "tv",
  updated_at: "2026-04-22T12:07:00.000Z",
  venue_id: "venue-1",
};

describe("displays workspace", () => {
  it("renders the views IA with the public slot selected by default", () => {
    const markup = renderToStaticMarkup(
      createElement(DisplaysWorkspace, {
        appUrl: "https://taproom.example",
        deletePlaylistAction: async () => {},
        deleteViewAction: async () => {},
        initialSearchParams: {},
        playlists: [tvPlaylist],
        savePlaylistAction: async () => {},
        saveViewAction: async () => {},
        venueSlug: "demo-taproom",
        views: [publicMenuView, tvDrinksView, embedEventsView],
      }),
    );

    expect(markup).toContain("Views");
    expect(markup).toContain("Playlists");
    expect(markup).toContain("Public");
    expect(markup).toContain("TV Displays");
    expect(markup).toContain("Embeds");
    expect(markup).toContain("Canonical public URL");
    expect(markup).not.toContain("Delete display");
  });

  it("renders a selected saved TV display with locked content context", () => {
    const markup = renderToStaticMarkup(
      createElement(DisplaysWorkspace, {
        appUrl: "https://taproom.example",
        deletePlaylistAction: async () => {},
        deleteViewAction: async () => {},
        initialSearchParams: {
          content: "drinks",
          surface: "tv",
          tab: "views",
          view: tvDrinksView.id,
        },
        playlists: [tvPlaylist],
        savePlaylistAction: async () => {},
        saveViewAction: async () => {},
        venueSlug: "demo-taproom",
        views: [publicMenuView, tvDrinksView, embedEventsView],
      }),
    );

    expect(markup).toContain("Edit display");
    expect(markup).toContain("Tap list TV");
    expect(markup).toContain("Delete display");
    expect(markup).toContain("Stable display URL");
    expect(markup).toContain("/tap-list-tv");
    expect(markup).not.toContain("Content");
  });

  it("renders playlist editing with same-surface view choices", () => {
    const markup = renderToStaticMarkup(
      createElement(DisplaysWorkspace, {
        appUrl: "https://taproom.example",
        deletePlaylistAction: async () => {},
        deleteViewAction: async () => {},
        initialSearchParams: {
          playlist: tvPlaylist.id,
          surface: "tv",
          tab: "playlists",
        },
        playlists: [tvPlaylist],
        savePlaylistAction: async () => {},
        saveViewAction: async () => {},
        venueSlug: "demo-taproom",
        views: [publicMenuView, tvDrinksView, embedEventsView],
      }),
    );

    expect(markup).toContain("TV Playlists");
    expect(markup).toContain("Edit playlist");
    expect(markup).toContain("Weekend rotation");
    expect(markup).toContain("Tap list TV");
    expect(markup).toContain("Drinks");
    expect(markup).toContain("Stable playlist URL");
  });
});

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { getDefaultDisplayViewConfig } from "../lib/displays";
import { DisplayPresetEditor, type DisplayPresetClientRecord } from "./display-preset-editor";
import { DisplayPresetList } from "./display-preset-list";

const viewPreset: DisplayPresetClientRecord = {
  config: getDefaultDisplayViewConfig("public", "menu"),
  default_surface: "public",
  id: "preset-view",
  kind: "view",
  name: "Mainroom",
  slug: "mainroom",
  updated_at: "2026-04-21T17:00:00.000Z",
};

const playlistPreset: DisplayPresetClientRecord = {
  config: {
    slides: [
      { durationSeconds: 12, presetSlug: "mainroom", transition: "fade" },
      { durationSeconds: 18, presetSlug: "events-night", transition: "fade" },
    ],
  },
  default_surface: "tv",
  id: "preset-playlist",
  kind: "playlist",
  name: "Rotation",
  slug: "rotation",
  updated_at: "2026-04-21T17:10:00.000Z",
};

describe("display admin workspace", () => {
  it("marks the selected preset in the saved preset rail", () => {
    const markup = renderToStaticMarkup(
      createElement(DisplayPresetList, {
        presets: [viewPreset, playlistPreset],
        selectedPresetId: viewPreset.id,
        venueSlug: "demo-taproom",
      }),
    );

    expect(markup).toContain('data-selected="true"');
    expect(markup).toContain('aria-current="page"');
    expect(markup).toContain("/mainroom");
    expect(markup).toContain("Public");
  });

  it("renders view editing with display settings, preview, and ad hoc share tools", () => {
    const markup = renderToStaticMarkup(
      createElement(DisplayPresetEditor, {
        appUrl: "https://taproom.example",
        deleteAction: async () => {},
        presets: [viewPreset, playlistPreset],
        saveAction: async () => {},
        selectedPreset: null,
        venueSlug: "demo-taproom",
      }),
    );

    expect(markup).toContain('data-display-editor-kind="view"');
    expect(markup).toContain("Display settings");
    expect(markup).toContain("Display controls");
    expect(markup).toContain("Live preview");
    expect(markup).toContain("Ad hoc URL");
    expect(markup).toContain("Embed iframe");
    expect(markup).toContain("Save this preset to generate stable");
    expect(markup).toContain('aria-label="More information about Preset type"');
  });

  it("renders playlist editing with slide controls and stable share links", () => {
    const markup = renderToStaticMarkup(
      createElement(DisplayPresetEditor, {
        appUrl: "https://taproom.example",
        deleteAction: async () => {},
        presets: [viewPreset, playlistPreset],
        saveAction: async () => {},
        selectedPreset: playlistPreset,
        venueSlug: "demo-taproom",
      }),
    );

    expect(markup).toContain('data-display-editor-kind="playlist"');
    expect(markup).toContain("Playlist slides");
    expect(markup).toContain("Stable public URL");
    expect(markup).toContain("Stable embed URL");
    expect(markup).toContain("Stable TV URL");
    expect(markup).not.toContain("Ad hoc URL");
    expect(markup).toContain("Rotation");
  });
});

import { describe, expect, it } from "vitest";

import {
  clampDisplayPreviewWidth,
  DEFAULT_DISPLAY_PREVIEW_WIDTH,
  normalizeDisplayWorkspaceState,
  serializeDisplayWorkspaceState,
} from "./display-admin";

describe("display admin helpers", () => {
  it("defaults workspace state to public views", () => {
    expect(normalizeDisplayWorkspaceState({})).toEqual({
      content: "menu",
      playlist: null,
      surface: "public",
      tab: "views",
      view: null,
    });
  });

  it("normalizes playlist state to saved surfaces only", () => {
    expect(
      normalizeDisplayWorkspaceState({
        playlist: "playlist-1",
        surface: "embed",
        tab: "playlists",
      }),
    ).toEqual({
      content: "menu",
      playlist: "playlist-1",
      surface: "embed",
      tab: "playlists",
      view: null,
    });
  });

  it("serializes only the relevant selection params", () => {
    expect(
      serializeDisplayWorkspaceState({
        content: "drinks",
        playlist: null,
        surface: "tv",
        tab: "views",
        view: "new",
      }),
    ).toBe("tab=views&surface=tv&content=drinks&view=new");

    expect(
      serializeDisplayWorkspaceState({
        content: "menu",
        playlist: "playlist-7",
        surface: "embed",
        tab: "playlists",
        view: null,
      }),
    ).toBe("tab=playlists&surface=embed&playlist=playlist-7");
  });

  it("clamps preview widths to the supported range", () => {
    expect(clampDisplayPreviewWidth(DEFAULT_DISPLAY_PREVIEW_WIDTH)).toBe(DEFAULT_DISPLAY_PREVIEW_WIDTH);
    expect(clampDisplayPreviewWidth(200)).toBe(320);
    expect(clampDisplayPreviewWidth(1000)).toBe(720);
  });
});

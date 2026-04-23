import { describe, expect, it } from "vitest";

import {
  getDraftDisplayContent,
  normalizeDisplayWorkspaceState,
  serializeDisplayWorkspaceState,
} from "./display-admin";

describe("display admin helpers", () => {
  it("defaults workspace state to the views tab with no open drawer", () => {
    expect(normalizeDisplayWorkspaceState({})).toEqual({
      drawer: null,
      tab: "views",
    });
  });

  it("normalizes public, saved, and playlist drawer states from query params", () => {
    expect(
      normalizeDisplayWorkspaceState({
        content: "food",
        surface: "public",
        tab: "views",
      }),
    ).toEqual({
      drawer: {
        content: "food",
        kind: "view",
        mode: "public",
        surface: "public",
        viewId: null,
      },
      tab: "views",
    });

    expect(
      normalizeDisplayWorkspaceState({
        content: "drinks",
        surface: "tv",
        tab: "views",
        view: "view-1",
      }),
    ).toEqual({
      drawer: {
        content: "drinks",
        kind: "view",
        mode: "saved",
        surface: "tv",
        viewId: "view-1",
      },
      tab: "views",
    });

    expect(
      normalizeDisplayWorkspaceState({
        playlist: "playlist-1",
        surface: "embed",
        tab: "playlists",
      }),
    ).toEqual({
      drawer: {
        kind: "playlist",
        mode: "saved",
        playlistId: "playlist-1",
        surface: "embed",
      },
      tab: "playlists",
    });
  });

  it("serializes only the active drawer selection", () => {
    expect(
      serializeDisplayWorkspaceState({
        drawer: null,
        tab: "views",
      }),
    ).toBe("tab=views");

    expect(
      serializeDisplayWorkspaceState({
        drawer: {
          content: "drinks",
          kind: "view",
          mode: "draft",
          surface: "tv",
          viewId: null,
        },
        tab: "views",
      }),
    ).toBe("tab=views&content=drinks&surface=tv&view=new");

    expect(
      serializeDisplayWorkspaceState({
        drawer: {
          kind: "playlist",
          mode: "saved",
          playlistId: "playlist-7",
          surface: "embed",
        },
        tab: "playlists",
      }),
    ).toBe("tab=playlists&surface=embed&playlist=playlist-7");
  });

  it("seeds draft content from the active filter", () => {
    expect(getDraftDisplayContent("all")).toBe("menu");
    expect(getDraftDisplayContent("events")).toBe("events");
  });
});

import {
  displayContentSchema,
  displaySurfaceSchema,
  savedDisplaySurfaceSchema,
  type DisplayContent,
  type SavedDisplaySurface,
} from "@/lib/displays";

export type DisplayAdminTab = "views" | "playlists";
export type DisplaySelectionToken = string | "new";
export type DisplayContentFilter = DisplayContent | "all";

export type DisplayViewDrawerState =
  | {
      content: DisplayContent;
      kind: "view";
      mode: "public";
      surface: "public";
      viewId: string | null;
    }
  | {
      content: DisplayContent;
      kind: "view";
      mode: "draft";
      surface: SavedDisplaySurface;
      viewId: null;
    }
  | {
      content: DisplayContent;
      kind: "view";
      mode: "saved";
      surface: SavedDisplaySurface;
      viewId: string;
    };

export type DisplayPlaylistDrawerState =
  | {
      kind: "playlist";
      mode: "draft";
      playlistId: null;
      surface: SavedDisplaySurface;
    }
  | {
      kind: "playlist";
      mode: "saved";
      playlistId: string;
      surface: SavedDisplaySurface;
    };

export type DisplayDrawerState = DisplayPlaylistDrawerState | DisplayViewDrawerState;

export type DisplayWorkspaceState = {
  drawer: DisplayDrawerState | null;
  tab: DisplayAdminTab;
};

export function getDraftDisplayContent(filter: DisplayContentFilter): DisplayContent {
  return filter === "all" ? "menu" : filter;
}

export function normalizeDisplayWorkspaceState(
  searchParams: Record<string, string | string[] | undefined>,
): DisplayWorkspaceState {
  const tab = searchParams.tab === "playlists" ? "playlists" : "views";

  if (tab === "playlists") {
    return {
      drawer: normalizePlaylistDrawerState(searchParams),
      tab,
    };
  }

  return {
    drawer: normalizeViewDrawerState(searchParams),
    tab,
  };
}

export function serializeDisplayWorkspaceState(state: DisplayWorkspaceState) {
  const params = new URLSearchParams();

  params.set("tab", state.tab);

  if (!state.drawer) {
    return params.toString();
  }

  if (state.drawer.kind === "view") {
    params.set("content", state.drawer.content);
    params.set("surface", state.drawer.surface);

    if (state.drawer.surface !== "public") {
      params.set("view", state.drawer.mode === "draft" ? "new" : state.drawer.viewId);
    }
  } else {
    params.set("surface", state.drawer.surface);
    params.set("playlist", state.drawer.mode === "draft" ? "new" : state.drawer.playlistId);
  }

  return params.toString();
}

function normalizePlaylistDrawerState(
  searchParams: Record<string, string | string[] | undefined>,
): DisplayPlaylistDrawerState | null {
  const surface = parseSavedSurface(searchParams.surface);
  const playlist = normalizeSelectionToken(searchParams.playlist);

  if (!surface || !playlist) {
    return null;
  }

  return playlist === "new"
    ? {
        kind: "playlist",
        mode: "draft",
        playlistId: null,
        surface,
      }
    : {
        kind: "playlist",
        mode: "saved",
        playlistId: playlist,
        surface,
      };
}

function normalizeViewDrawerState(
  searchParams: Record<string, string | string[] | undefined>,
): DisplayViewDrawerState | null {
  const surface = parseSurface(searchParams.surface);
  const content = parseContent(searchParams.content);
  const view = normalizeSelectionToken(searchParams.view);

  if (surface === "public") {
    if (!content) {
      return null;
    }

    return {
      content,
      kind: "view",
      mode: "public",
      surface,
      viewId: null,
    };
  }

  if (!surface || !view) {
    return null;
  }

  return view === "new"
    ? {
        content: content ?? "menu",
        kind: "view",
        mode: "draft",
        surface,
        viewId: null,
      }
    : {
        content: content ?? "menu",
        kind: "view",
        mode: "saved",
        surface,
        viewId: view,
      };
}

function normalizeSelectionToken(value: string | string[] | undefined): DisplaySelectionToken | null {
  const normalized = Array.isArray(value) ? value[0] : value;

  if (!normalized) {
    return null;
  }

  return normalized === "new" ? "new" : normalized;
}

function parseContent(value: string | string[] | undefined) {
  const normalized = Array.isArray(value) ? value[0] : value;

  if (!normalized) {
    return undefined;
  }

  const parsed = displayContentSchema.safeParse(normalized);
  return parsed.success ? parsed.data : undefined;
}

function parseSurface(value: string | string[] | undefined) {
  const normalized = Array.isArray(value) ? value[0] : value;

  if (!normalized) {
    return undefined;
  }

  const parsed = displaySurfaceSchema.safeParse(normalized);
  return parsed.success ? parsed.data : undefined;
}

function parseSavedSurface(value: string | string[] | undefined): SavedDisplaySurface | undefined {
  const normalized = Array.isArray(value) ? value[0] : value;

  if (!normalized) {
    return undefined;
  }

  const parsed = savedDisplaySurfaceSchema.safeParse(normalized);
  return parsed.success ? parsed.data : undefined;
}

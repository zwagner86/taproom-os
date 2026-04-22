import {
  displayContentSchema,
  displaySurfaceSchema,
  savedDisplaySurfaceSchema,
  type DisplayContent,
  type DisplaySurface,
  type SavedDisplaySurface,
} from "@/lib/displays";

export const DEFAULT_DISPLAY_PREVIEW_WIDTH = 420;
export const MIN_DISPLAY_PREVIEW_WIDTH = 320;
export const MAX_DISPLAY_PREVIEW_WIDTH = 720;
export const DISPLAY_PREVIEW_WIDTH_STORAGE_KEY = "taproom.display.preview-width";

export type DisplayAdminTab = "views" | "playlists";
export type DisplaySelectionToken = string | "new" | null;

export type DisplayWorkspaceState = {
  content: DisplayContent;
  playlist: DisplaySelectionToken;
  surface: DisplaySurface;
  tab: DisplayAdminTab;
  view: DisplaySelectionToken;
};

export function clampDisplayPreviewWidth(width: number) {
  return Math.max(MIN_DISPLAY_PREVIEW_WIDTH, Math.min(MAX_DISPLAY_PREVIEW_WIDTH, Math.round(width)));
}

export function normalizeDisplayWorkspaceState(
  searchParams: Record<string, string | string[] | undefined>,
): DisplayWorkspaceState {
  const tab = searchParams.tab === "playlists" ? "playlists" : "views";
  const content = parseContent(searchParams.content) ?? "menu";
  const requestedSurface = parseSurface(searchParams.surface);
  const surface = tab === "playlists"
    ? (parseSavedSurface(searchParams.surface) ?? "tv")
    : (requestedSurface ?? "public");

  return {
    content,
    playlist: normalizeSelectionToken(searchParams.playlist),
    surface,
    tab,
    view: normalizeSelectionToken(searchParams.view),
  };
}

export function serializeDisplayWorkspaceState(state: DisplayWorkspaceState) {
  const params = new URLSearchParams();

  params.set("tab", state.tab);
  params.set("surface", state.surface);

  if (state.tab === "views") {
    params.set("content", state.content);

    if (state.surface !== "public" && state.view) {
      params.set("view", state.view);
    }
  } else if (state.playlist) {
    params.set("playlist", state.playlist);
  }

  return params.toString();
}

function normalizeSelectionToken(value: string | string[] | undefined): DisplaySelectionToken {
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

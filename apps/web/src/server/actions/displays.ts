"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  DISPLAY_CONTENTS,
  buildSavedDisplayPath,
  coerceDisplayPlaylistConfig,
  coerceDisplayViewOptions,
  displayContentSchema,
  displaySurfaceSchema,
  getCanonicalPublicDisplayPath,
  savedDisplaySurfaceSchema,
  type DisplayContent,
  type DisplaySurface,
  type SavedDisplaySurface,
} from "@/lib/displays";
import { slugify } from "@/lib/utils";
import {
  createDisplayPlaylistAdmin,
  deleteDisplayPlaylistAdmin,
  getVenueDisplayPlaylistById,
  getVenueDisplayPlaylistBySurfaceAndSlug,
  listVenueDisplayPlaylists,
  updateDisplayPlaylistAdmin,
} from "@/server/repositories/display-playlists";
import {
  createDisplayViewAdmin,
  deleteDisplayViewAdmin,
  getVenueDisplayViewById,
  getVenueDisplayViewBySurfaceAndContent,
  getVenueDisplayViewBySurfaceAndSlug,
  listVenueDisplayViews,
  updateDisplayViewAdmin,
} from "@/server/repositories/display-views";
import { requireVenueAccess } from "@/server/repositories/venues";

export async function saveDisplayViewAction(venueSlug: string, formData: FormData) {
  try {
    const access = await requireVenueAccess(venueSlug);
    const viewId = normalizeOptionalString(formData.get("view_id"));
    const content = displayContentSchema.parse(String(formData.get("content") ?? "menu"));
    const surface = displaySurfaceSchema.parse(String(formData.get("surface") ?? "public"));
    const rawOptions = parseJsonObject(formData.get("config_json"), "Display config must be a JSON object.");
    const options = coerceDisplayViewOptions(rawOptions, { content, surface });

    if (surface === "public") {
      const existingPublicView = await getVenueDisplayViewBySurfaceAndContent(access.venue.id, "public", content);
      const saved = existingPublicView
        ? await updateDisplayViewAdmin(access.venue.id, existingPublicView.id, {
            config: options,
            content,
            name: null,
            slug: null,
            surface,
          })
        : await createDisplayViewAdmin({
            config: options,
            content,
            name: null,
            slug: null,
            surface,
            venue_id: access.venue.id,
          });

      revalidateDisplayRoutes(venueSlug, { publicContent: content });
      redirect(withDisplayQuery(venueSlug, {
        content,
        message: "Public display saved.",
        surface,
        tab: "views",
      }));
    }

    const name = String(formData.get("name") ?? "").trim();
    const slug = slugify(String(formData.get("slug") ?? name));

    if (!name) {
      throw new Error("Display name is required.");
    }

    if (!slug) {
      throw new Error("Display slug is required.");
    }

    await ensureSavedDisplaySlugAvailable(access.venue.id, surface, slug, { viewId });

    if (viewId) {
      const existingView = await getVenueDisplayViewById(access.venue.id, viewId);

      if (!existingView) {
        throw new Error("Display view not found.");
      }

      const updated = await updateDisplayViewAdmin(access.venue.id, viewId, {
        config: options,
        content,
        name,
        slug,
        surface,
      });

      revalidateDisplayRoutes(venueSlug, {
        previousSavedSlug: existingView.slug,
        publicContent: content,
        savedSlug: updated.slug,
        savedSurface: surface,
      });
      redirect(withDisplayQuery(venueSlug, {
        content,
        message: "Display view saved.",
        surface,
        tab: "views",
        view: updated.id,
      }));
    }

    const created = await createDisplayViewAdmin({
      config: options,
      content,
      name,
      slug,
      surface,
      venue_id: access.venue.id,
    });

    revalidateDisplayRoutes(venueSlug, {
      publicContent: content,
      savedSlug: created.slug,
      savedSurface: surface,
    });
    redirect(withDisplayQuery(venueSlug, {
      content,
      message: "Display view created.",
      surface,
      tab: "views",
      view: created.id,
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save display view.";
    const content = safeParseContent(formData.get("content")) ?? "menu";
    const surface = safeParseSurface(formData.get("surface")) ?? "public";
    const view = normalizeOptionalString(formData.get("view_id")) ?? (surface === "public" ? null : "new");

    redirect(withDisplayQuery(venueSlug, {
      content,
      error: message,
      surface,
      tab: "views",
      view,
    }));
  }
}

export async function deleteDisplayViewAction(venueSlug: string, formData: FormData) {
  try {
    const access = await requireVenueAccess(venueSlug);
    const viewId = String(formData.get("view_id") ?? "");

    if (!viewId) {
      throw new Error("Display view not found.");
    }

    const view = await getVenueDisplayViewById(access.venue.id, viewId);

    if (!view) {
      throw new Error("Display view not found.");
    }

    if (view.surface === "public") {
      throw new Error("Public display slots cannot be deleted.");
    }

    const playlists = await listVenueDisplayPlaylists(access.venue.id);
    const blockingPlaylist = playlists.find((playlist) =>
      playlist.config.slides.some((slide) => slide.viewId === viewId),
    );

    if (blockingPlaylist) {
      throw new Error(`"${view.name}" is still used by playlist "${blockingPlaylist.name}". Remove it from that playlist first.`);
    }

    await deleteDisplayViewAdmin(access.venue.id, viewId);
    revalidateDisplayRoutes(venueSlug, {
      previousSavedSlug: view.slug,
      publicContent: view.content,
      savedSurface: view.surface,
    });
    redirect(withDisplayQuery(venueSlug, {
      content: view.content,
      message: "Display view deleted.",
      surface: view.surface,
      tab: "views",
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete display view.";
    const content = safeParseContent(formData.get("content")) ?? "menu";
    const surface = safeParseSurface(formData.get("surface")) ?? "public";
    const view = normalizeOptionalString(formData.get("view_id"));

    redirect(withDisplayQuery(venueSlug, {
      content,
      error: message,
      surface,
      tab: "views",
      view,
    }));
  }
}

export async function saveDisplayPlaylistAction(venueSlug: string, formData: FormData) {
  try {
    const access = await requireVenueAccess(venueSlug);
    const playlistId = normalizeOptionalString(formData.get("playlist_id"));
    const surface = savedDisplaySurfaceSchema.parse(String(formData.get("surface") ?? "tv"));
    const name = String(formData.get("name") ?? "").trim();
    const slug = slugify(String(formData.get("slug") ?? name));
    const rawConfig = parseJsonObject(formData.get("config_json"), "Playlist config must be a JSON object.");

    if (!name) {
      throw new Error("Playlist name is required.");
    }

    if (!slug) {
      throw new Error("Playlist slug is required.");
    }

    await ensureSavedDisplaySlugAvailable(access.venue.id, surface, slug, { playlistId });

    const views = await listVenueDisplayViews(access.venue.id);
    const viewMap = new Map(views.map((view) => [view.id, view]));
    const config = validateDisplayPlaylistConfig(rawConfig, surface, viewMap);

    if (playlistId) {
      const existingPlaylist = await getVenueDisplayPlaylistById(access.venue.id, playlistId);

      if (!existingPlaylist) {
        throw new Error("Playlist not found.");
      }

      const updated = await updateDisplayPlaylistAdmin(access.venue.id, playlistId, {
        config,
        name,
        slug,
        surface,
      });

      revalidateDisplayRoutes(venueSlug, {
        previousSavedSlug: existingPlaylist.slug,
        savedSlug: updated.slug,
        savedSurface: surface,
      });
      redirect(withDisplayQuery(venueSlug, {
        message: "Playlist saved.",
        playlist: updated.id,
        surface,
        tab: "playlists",
      }));
    }

    const created = await createDisplayPlaylistAdmin({
      config,
      name,
      slug,
      surface,
      venue_id: access.venue.id,
    });

    revalidateDisplayRoutes(venueSlug, {
      savedSlug: created.slug,
      savedSurface: surface,
    });
    redirect(withDisplayQuery(venueSlug, {
      message: "Playlist created.",
      playlist: created.id,
      surface,
      tab: "playlists",
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save playlist.";
    const surface = safeParseSavedSurface(formData.get("surface")) ?? "tv";
    const playlist = normalizeOptionalString(formData.get("playlist_id")) ?? "new";

    redirect(withDisplayQuery(venueSlug, {
      error: message,
      playlist,
      surface,
      tab: "playlists",
    }));
  }
}

export async function deleteDisplayPlaylistAction(venueSlug: string, formData: FormData) {
  try {
    const access = await requireVenueAccess(venueSlug);
    const playlistId = String(formData.get("playlist_id") ?? "");

    if (!playlistId) {
      throw new Error("Playlist not found.");
    }

    const playlist = await getVenueDisplayPlaylistById(access.venue.id, playlistId);

    if (!playlist) {
      throw new Error("Playlist not found.");
    }

    await deleteDisplayPlaylistAdmin(access.venue.id, playlistId);
    revalidateDisplayRoutes(venueSlug, {
      previousSavedSlug: playlist.slug,
      savedSurface: playlist.surface,
    });
    redirect(withDisplayQuery(venueSlug, {
      message: "Playlist deleted.",
      surface: playlist.surface,
      tab: "playlists",
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete playlist.";
    const surface = safeParseSavedSurface(formData.get("surface")) ?? "tv";
    const playlist = normalizeOptionalString(formData.get("playlist_id"));

    redirect(withDisplayQuery(venueSlug, {
      error: message,
      playlist,
      surface,
      tab: "playlists",
    }));
  }
}

function parseJsonObject(value: FormDataEntryValue | null, errorMessage: string) {
  const rawValue = String(value ?? "{}");
  const parsed = JSON.parse(rawValue) as unknown;

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(errorMessage);
  }

  return parsed;
}

async function ensureSavedDisplaySlugAvailable(
  venueId: string,
  surface: SavedDisplaySurface,
  slug: string,
  options: { playlistId?: string | null; viewId?: string | null } = {},
) {
  const [view, playlist] = await Promise.all([
    getVenueDisplayViewBySurfaceAndSlug(venueId, surface, slug),
    getVenueDisplayPlaylistBySurfaceAndSlug(venueId, surface, slug),
  ]);

  if (view && view.id !== options.viewId) {
    throw new Error(`The slug "${slug}" is already used by display view "${view.name}".`);
  }

  if (playlist && playlist.id !== options.playlistId) {
    throw new Error(`The slug "${slug}" is already used by playlist "${playlist.name}".`);
  }
}

function validateDisplayPlaylistConfig(
  input: unknown,
  surface: SavedDisplaySurface,
  viewMap: Map<string, Awaited<ReturnType<typeof listVenueDisplayViews>>[number]>,
) {
  const config = coerceDisplayPlaylistConfig(input);

  for (const slide of config.slides) {
    const referencedView = viewMap.get(slide.viewId);

    if (!referencedView) {
      throw new Error("Each playlist slide must reference an existing display view.");
    }

    if (referencedView.surface === "public") {
      throw new Error("Public display views cannot be added to playlists.");
    }

    if (referencedView.surface !== surface) {
      throw new Error("Playlist slides must all use display views from the same surface.");
    }
  }

  return config;
}

function revalidateDisplayRoutes(
  venueSlug: string,
  options: {
    previousSavedSlug?: string | null;
    publicContent?: DisplayContent;
    savedSlug?: string | null;
    savedSurface?: SavedDisplaySurface;
  } = {},
) {
  revalidatePath(`/app/${venueSlug}/displays`);

  for (const content of DISPLAY_CONTENTS) {
    revalidatePath(getCanonicalPublicDisplayPath(venueSlug, content));
  }

  revalidatePath(`/embed/${venueSlug}/display`);
  revalidatePath(`/tv/${venueSlug}/display`);

  if (options.savedSurface && options.savedSlug) {
    revalidatePath(buildSavedDisplayPath(venueSlug, options.savedSlug, options.savedSurface));
  }

  if (options.savedSurface && options.previousSavedSlug) {
    revalidatePath(buildSavedDisplayPath(venueSlug, options.previousSavedSlug, options.savedSurface));
  }
}

function withDisplayQuery(
  venueSlug: string,
  params: {
    content?: DisplayContent;
    error?: string;
    message?: string;
    playlist?: string | null;
    surface?: DisplaySurface;
    tab: "playlists" | "views";
    view?: string | null;
  },
) {
  const query = new URLSearchParams();

  query.set("tab", params.tab);

  if (params.content) {
    query.set("content", params.content);
  }

  if (params.surface) {
    query.set("surface", params.surface);
  }

  if (params.view) {
    query.set("view", params.view);
  }

  if (params.playlist) {
    query.set("playlist", params.playlist);
  }

  if (params.message) {
    query.set("message", params.message);
  }

  if (params.error) {
    query.set("error", params.error);
  }

  const suffix = query.toString();
  return `/app/${venueSlug}/displays${suffix ? `?${suffix}` : ""}`;
}

function normalizeOptionalString(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : null;
}

function safeParseContent(value: FormDataEntryValue | null) {
  const parsed = displayContentSchema.safeParse(String(value ?? ""));
  return parsed.success ? parsed.data : null;
}

function safeParseSurface(value: FormDataEntryValue | null) {
  const parsed = displaySurfaceSchema.safeParse(String(value ?? ""));
  return parsed.success ? parsed.data : null;
}

function safeParseSavedSurface(value: FormDataEntryValue | null) {
  const parsed = savedDisplaySurfaceSchema.safeParse(String(value ?? ""));
  return parsed.success ? parsed.data : null;
}

import type { Database } from "../../../../../supabase/types";
import {
  coerceDisplayPlaylistConfig,
  savedDisplaySurfaceSchema,
  type DisplayPlaylistConfig,
  type SavedDisplaySurface,
} from "@/lib/displays";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type DisplayPlaylistRow = Database["public"]["Tables"]["display_playlists"]["Row"];
export type DisplayPlaylistInsert = Database["public"]["Tables"]["display_playlists"]["Insert"];
export type DisplayPlaylistUpdate = Database["public"]["Tables"]["display_playlists"]["Update"];

export type DisplayPlaylistRecord = Omit<DisplayPlaylistRow, "config" | "surface"> & {
  config: DisplayPlaylistConfig;
  surface: SavedDisplaySurface;
};

export async function listVenueDisplayPlaylists(venueId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("display_playlists")
    .select("*")
    .eq("venue_id", venueId)
    .order("surface", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map(hydrateDisplayPlaylist);
}

export async function getVenueDisplayPlaylistById(venueId: string, playlistId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("display_playlists")
    .select("*")
    .eq("venue_id", venueId)
    .eq("id", playlistId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? hydrateDisplayPlaylist(data) : null;
}

export async function getVenueDisplayPlaylistBySurfaceAndSlug(
  venueId: string,
  surface: SavedDisplaySurface,
  slug: string,
) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("display_playlists")
    .select("*")
    .eq("venue_id", venueId)
    .eq("surface", surface)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? hydrateDisplayPlaylist(data) : null;
}

export async function createDisplayPlaylistAdmin(input: DisplayPlaylistInsert) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("display_playlists").insert(input).select("*").single();

  if (error) {
    throw error;
  }

  return hydrateDisplayPlaylist(data);
}

export async function updateDisplayPlaylistAdmin(venueId: string, playlistId: string, updates: DisplayPlaylistUpdate) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("display_playlists")
    .update(updates)
    .eq("venue_id", venueId)
    .eq("id", playlistId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return hydrateDisplayPlaylist(data);
}

export async function deleteDisplayPlaylistAdmin(venueId: string, playlistId: string) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("display_playlists")
    .delete()
    .eq("venue_id", venueId)
    .eq("id", playlistId);

  if (error) {
    throw error;
  }
}

export function hydrateDisplayPlaylist(row: DisplayPlaylistRow): DisplayPlaylistRecord {
  return {
    ...row,
    config: coerceDisplayPlaylistConfig(row.config),
    surface: savedDisplaySurfaceSchema.parse(row.surface),
  };
}

import type { Database } from "../../../../../supabase/types";
import {
  coerceDisplayViewOptions,
  displayContentSchema,
  displaySurfaceSchema,
  getDefaultDisplayViewConfig,
  hydrateDisplayViewConfig,
  type DisplayContent,
  type DisplaySurface,
  type DisplayViewConfig,
  type DisplayViewOptions,
} from "@/lib/displays";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getVenueBySlug } from "@/server/repositories/venues";

export type DisplayViewRow = Database["public"]["Tables"]["display_views"]["Row"];
export type DisplayViewInsert = Database["public"]["Tables"]["display_views"]["Insert"];
export type DisplayViewUpdate = Database["public"]["Tables"]["display_views"]["Update"];

export type DisplayViewRecord = Omit<DisplayViewRow, "config" | "content" | "surface"> & {
  config: DisplayViewConfig;
  content: DisplayContent;
  options: DisplayViewOptions;
  surface: DisplaySurface;
};

export async function listVenueDisplayViews(venueId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("display_views")
    .select("*")
    .eq("venue_id", venueId)
    .order("content", { ascending: true })
    .order("surface", { ascending: true })
    .order("name", { ascending: true, nullsFirst: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map(hydrateDisplayView);
}

export async function getVenueDisplayViewById(venueId: string, viewId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("display_views")
    .select("*")
    .eq("venue_id", venueId)
    .eq("id", viewId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? hydrateDisplayView(data) : null;
}

export async function getVenueDisplayViewBySurfaceAndSlug(
  venueId: string,
  surface: DisplaySurface,
  slug: string,
) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("display_views")
    .select("*")
    .eq("venue_id", venueId)
    .eq("surface", surface)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? hydrateDisplayView(data) : null;
}

export async function getVenueDisplayViewBySurfaceAndContent(
  venueId: string,
  surface: DisplaySurface,
  content: DisplayContent,
) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("display_views")
    .select("*")
    .eq("venue_id", venueId)
    .eq("surface", surface)
    .eq("content", content)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? hydrateDisplayView(data) : null;
}

export async function getCanonicalPublicDisplayViewConfig(
  venueSlug: string,
  content: DisplayContent,
) {
  const venue = await getVenueBySlug(venueSlug);

  if (!venue) {
    return null;
  }

  const view = await getVenueDisplayViewBySurfaceAndContent(venue.id, "public", content);

  return {
    config: view?.config ?? getDefaultDisplayViewConfig("public", content),
    venue,
    view,
  };
}

export async function createDisplayViewAdmin(input: DisplayViewInsert) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("display_views").insert(input).select("*").single();

  if (error) {
    throw error;
  }

  return hydrateDisplayView(data);
}

export async function updateDisplayViewAdmin(venueId: string, viewId: string, updates: DisplayViewUpdate) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("display_views")
    .update(updates)
    .eq("venue_id", venueId)
    .eq("id", viewId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return hydrateDisplayView(data);
}

export async function deleteDisplayViewAdmin(venueId: string, viewId: string) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("display_views")
    .delete()
    .eq("venue_id", venueId)
    .eq("id", viewId);

  if (error) {
    throw error;
  }
}

export function hydrateDisplayView(row: DisplayViewRow): DisplayViewRecord {
  const content = displayContentSchema.parse(row.content);
  const surface = displaySurfaceSchema.parse(row.surface);
  const options = coerceDisplayViewOptions(row.config, { content, surface });

  return {
    ...row,
    config: hydrateDisplayViewConfig(options, content, surface),
    content,
    options,
    surface,
  };
}

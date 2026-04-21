import type { Database } from "../../../../../supabase/types";
import {
  coerceDisplayPlaylistConfig,
  coerceDisplayViewConfig,
  displayPresetKindSchema,
  displaySurfaceSchema,
  type DisplayPlaylistConfig,
  type DisplayPresetKind,
  type DisplaySurface,
  type DisplayViewConfig,
} from "@/lib/displays";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getVenueBySlug } from "@/server/repositories/venues";

export type DisplayPresetRow = Database["public"]["Tables"]["display_presets"]["Row"];
export type DisplayPresetInsert = Database["public"]["Tables"]["display_presets"]["Insert"];
export type DisplayPresetUpdate = Database["public"]["Tables"]["display_presets"]["Update"];
export type DisplayPresetConfig = DisplayViewConfig | DisplayPlaylistConfig;

type DisplayPresetRecordBase = Omit<DisplayPresetRow, "config" | "default_surface" | "kind"> & {
  default_surface: DisplaySurface;
};

export type DisplayViewPresetRecord = DisplayPresetRecordBase & {
  config: DisplayViewConfig;
  kind: "view";
};

export type DisplayPlaylistPresetRecord = DisplayPresetRecordBase & {
  config: DisplayPlaylistConfig;
  kind: "playlist";
};

export type DisplayPresetRecord =
  | DisplayViewPresetRecord
  | DisplayPlaylistPresetRecord;

export type DisplayPresetRecordInput = DisplayPresetRecordBase & {
  config: DisplayPresetConfig;
  kind: DisplayPresetKind;
};

export async function listVenueDisplayPresets(venueId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("display_presets")
    .select("*")
    .eq("venue_id", venueId)
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map(hydrateDisplayPreset);
}

export async function getVenueDisplayPresetById(venueId: string, presetId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("display_presets")
    .select("*")
    .eq("venue_id", venueId)
    .eq("id", presetId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? hydrateDisplayPreset(data) : null;
}

export async function getVenueDisplayPresetBySlug(venueId: string, presetSlug: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("display_presets")
    .select("*")
    .eq("venue_id", venueId)
    .eq("slug", presetSlug)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? hydrateDisplayPreset(data) : null;
}

export async function getPublicDisplayPreset(venueSlug: string, presetSlug: string) {
  const venue = await getVenueBySlug(venueSlug);

  if (!venue) {
    return { preset: null, venue: null };
  }

  const preset = await getVenueDisplayPresetBySlug(venue.id, presetSlug);
  return { preset, venue };
}

export async function createDisplayPresetAdmin(input: DisplayPresetInsert) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("display_presets").insert(input).select("*").single();

  if (error) {
    throw error;
  }

  return hydrateDisplayPreset(data);
}

export async function updateDisplayPresetAdmin(venueId: string, presetId: string, updates: DisplayPresetUpdate) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("display_presets")
    .update(updates)
    .eq("venue_id", venueId)
    .eq("id", presetId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return hydrateDisplayPreset(data);
}

export async function deleteDisplayPresetAdmin(venueId: string, presetId: string) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("display_presets")
    .delete()
    .eq("venue_id", venueId)
    .eq("id", presetId);

  if (error) {
    throw error;
  }
}

export function hydrateDisplayPreset(row: DisplayPresetRow): DisplayPresetRecord {
  const kind = displayPresetKindSchema.parse(row.kind);
  const defaultSurface = displaySurfaceSchema.parse(row.default_surface);
  const base = {
    ...row,
    default_surface: defaultSurface,
  } satisfies DisplayPresetRecordBase;

  if (kind === "playlist") {
    return {
      ...base,
      config: coerceDisplayPlaylistConfig(row.config),
      kind,
    };
  }

  return {
    ...base,
    config: coerceDisplayViewConfig(row.config),
    kind,
  };
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  coerceDisplayPlaylistConfig,
  coerceDisplayViewConfig,
  displayPresetKindSchema,
  displaySurfaceSchema,
} from "@/lib/displays";
import { slugify } from "@/lib/utils";
import {
  createDisplayPresetAdmin,
  deleteDisplayPresetAdmin,
  getVenueDisplayPresetById,
  listVenueDisplayPresets,
  updateDisplayPresetAdmin,
} from "@/server/repositories/display-presets";
import { requireVenueAccess } from "@/server/repositories/venues";

export async function saveDisplayPresetAction(venueSlug: string, formData: FormData) {
  try {
    const access = await requireVenueAccess(venueSlug);
    const presetId = normalizeOptionalString(formData.get("preset_id"));
    const name = String(formData.get("name") ?? "").trim();
    const slug = slugify(String(formData.get("slug") ?? name));
    const kind = displayPresetKindSchema.parse(String(formData.get("kind") ?? "view"));
    const defaultSurface = displaySurfaceSchema.parse(String(formData.get("default_surface") ?? "public"));
    const rawConfig = String(formData.get("config_json") ?? "{}");

    if (!name) {
      throw new Error("Preset name is required.");
    }

    if (!slug) {
      throw new Error("Preset slug is required.");
    }

    const parsedConfig = JSON.parse(rawConfig) as unknown;

    if (!parsedConfig || typeof parsedConfig !== "object" || Array.isArray(parsedConfig)) {
      throw new Error("Display config must be a JSON object.");
    }

    const allPresets = await listVenueDisplayPresets(access.venue.id);
    const viewPresetSlugs = new Set(
      allPresets
        .filter((preset) => preset.kind === "view" && preset.id !== presetId)
        .map((preset) => preset.slug),
    );

    const config = kind === "playlist"
      ? validatePlaylistConfig(parsedConfig, viewPresetSlugs)
      : coerceDisplayViewConfig({
          ...parsedConfig,
          surface: defaultSurface,
        });

    if (presetId) {
      const existingPreset = await getVenueDisplayPresetById(access.venue.id, presetId);

      if (!existingPreset) {
        throw new Error("Preset not found.");
      }

      const updated = await updateDisplayPresetAdmin(access.venue.id, presetId, {
        config,
        default_surface: defaultSurface,
        kind,
        name,
        slug,
      });

      revalidateDisplayAdmin(venueSlug);
      redirect(`/app/${venueSlug}/displays?message=${encodeURIComponent("Display preset saved.")}&preset=${updated.slug}`);
    }

    const created = await createDisplayPresetAdmin({
      config,
      default_surface: defaultSurface,
      kind,
      name,
      slug,
      venue_id: access.venue.id,
    });

    revalidateDisplayAdmin(venueSlug);
    redirect(`/app/${venueSlug}/displays?message=${encodeURIComponent("Display preset created.")}&preset=${created.slug}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save display preset.";
    redirect(`/app/${venueSlug}/displays?error=${encodeURIComponent(message)}`);
  }
}

export async function deleteDisplayPresetAction(venueSlug: string, formData: FormData) {
  try {
    const access = await requireVenueAccess(venueSlug);
    const presetId = String(formData.get("preset_id") ?? "");

    if (!presetId) {
      throw new Error("Preset not found.");
    }

    await deleteDisplayPresetAdmin(access.venue.id, presetId);
    revalidateDisplayAdmin(venueSlug);
    redirect(`/app/${venueSlug}/displays?message=${encodeURIComponent("Display preset deleted.")}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete display preset.";
    redirect(`/app/${venueSlug}/displays?error=${encodeURIComponent(message)}`);
  }
}

function normalizeOptionalString(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : null;
}

function validatePlaylistConfig(input: unknown, viewPresetSlugs: Set<string>) {
  const config = coerceDisplayPlaylistConfig(input);

  for (const slide of config.slides) {
    if (!viewPresetSlugs.has(slide.presetSlug)) {
      throw new Error(`Playlist slide "${slide.presetSlug}" must reference an existing view preset.`);
    }
  }

  return config;
}

function revalidateDisplayAdmin(venueSlug: string) {
  revalidatePath(`/app/${venueSlug}/displays`);
}

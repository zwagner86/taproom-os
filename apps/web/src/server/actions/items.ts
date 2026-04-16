"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { Database } from "../../../../../supabase/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type ItemInsert = Database["public"]["Tables"]["items"]["Insert"];
type ItemUpdate = Database["public"]["Tables"]["items"]["Update"];

export async function createItemAction(venueSlug: string, formData: FormData) {
  const access = await getVenueAccessOrRedirect(venueSlug);
  const supabase = await createServerSupabaseClient();

  const payload: ItemInsert = {
    abv: parseOptionalNumber(formData.get("abv")),
    active: true,
    description: normalizeOptionalString(formData.get("description")),
    display_order: parseOptionalInteger(formData.get("display_order")) ?? 0,
    image_url: normalizeOptionalString(formData.get("image_url")),
    name: String(formData.get("name") ?? "").trim(),
    price_source: "unpriced",
    style_or_category: normalizeOptionalString(formData.get("style_or_category")),
    type: String(formData.get("type") ?? "pour") as ItemInsert["type"],
    venue_id: access.venue.id,
  };

  const { error } = await supabase.from("items").insert(payload);

  if (error) {
    redirect(`/app/${venueSlug}/items?error=${encodeURIComponent(error.message)}`);
  }

  revalidateVenueContent(venueSlug);
  redirect(`/app/${venueSlug}/items?message=${encodeURIComponent("Item created.")}`);
}

export async function updateItemAction(venueSlug: string, formData: FormData) {
  const access = await getVenueAccessOrRedirect(venueSlug);
  const supabase = await createServerSupabaseClient();
  const itemId = String(formData.get("item_id") ?? "");

  const payload: ItemUpdate = {
    abv: parseOptionalNumber(formData.get("abv")),
    active: String(formData.get("active") ?? "false") === "on",
    description: normalizeOptionalString(formData.get("description")),
    display_order: parseOptionalInteger(formData.get("display_order")) ?? 0,
    image_url: normalizeOptionalString(formData.get("image_url")),
    name: String(formData.get("name") ?? "").trim(),
    style_or_category: normalizeOptionalString(formData.get("style_or_category")),
    type: String(formData.get("type") ?? "pour") as ItemUpdate["type"],
  };

  const { error } = await supabase.from("items").update(payload).eq("id", itemId).eq("venue_id", access.venue.id);

  if (error) {
    redirect(`/app/${venueSlug}/items?error=${encodeURIComponent(error.message)}`);
  }

  revalidateVenueContent(venueSlug);
  redirect(`/app/${venueSlug}/items?message=${encodeURIComponent("Item updated.")}`);
}

export async function deleteItemAction(venueSlug: string, formData: FormData) {
  const access = await getVenueAccessOrRedirect(venueSlug);
  const supabase = await createServerSupabaseClient();
  const itemId = String(formData.get("item_id") ?? "");

  const { error } = await supabase.from("items").delete().eq("id", itemId).eq("venue_id", access.venue.id);

  if (error) {
    redirect(`/app/${venueSlug}/items?error=${encodeURIComponent(error.message)}`);
  }

  revalidateVenueContent(venueSlug);
  redirect(`/app/${venueSlug}/items?message=${encodeURIComponent("Item removed.")}`);
}

function parseOptionalInteger(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    return null;
  }
  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseOptionalNumber(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    return null;
  }
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeOptionalString(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : null;
}

async function getVenueAccessOrRedirect(slug: string) {
  try {
    const { requireVenueAccess } = await import("@/server/repositories/venues");
    return await requireVenueAccess(slug);
  } catch {
    redirect("/");
  }
}

function revalidateVenueContent(venueSlug: string) {
  revalidatePath(`/app/${venueSlug}/items`);
  revalidatePath(`/v/${venueSlug}/menu`);
  revalidatePath(`/embed/${venueSlug}/menu`);
  revalidatePath(`/tv/${venueSlug}`);
}


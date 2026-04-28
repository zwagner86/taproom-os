"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { Database } from "../../../../../supabase/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDemoVenueFormState, redirectForDemoVenue } from "@/server/demo-venue";

type ItemInsert = Database["public"]["Tables"]["items"]["Insert"];
type ItemUpdate = Database["public"]["Tables"]["items"]["Update"];
type ItemServingInsert = Database["public"]["Tables"]["item_servings"]["Insert"];
type ItemServingUpdate = Database["public"]["Tables"]["item_servings"]["Update"];
type MenuSectionInsert = Database["public"]["Tables"]["menu_sections"]["Insert"];
type MenuSectionUpdate = Database["public"]["Tables"]["menu_sections"]["Update"];
type ItemStatus = Database["public"]["Enums"]["item_status"];
type ItemType = Database["public"]["Enums"]["item_type"];

export type ItemFormState = { message?: string; error?: string } | null;

const ITEM_TYPES: ItemType[] = ["pour", "food", "merch"];
const ITEM_STATUSES: ItemStatus[] = ["active", "coming_soon", "hidden"];

export async function createItemAction(
  venueSlug: string,
  _prevState: ItemFormState,
  formData: FormData,
): Promise<ItemFormState> {
  const access = await getVenueAccessOrRedirect(venueSlug);

  if (access.isDemoVenue) {
    return getDemoVenueFormState<ItemFormState>();
  }

  const supabase = await createServerSupabaseClient();

  const payload: ItemInsert = {
    abv: parseOptionalNumber(formData.get("abv")),
    active: parseItemStatus(formData.get("status")) !== "hidden",
    description: normalizeOptionalString(formData.get("description")),
    display_order: parseOptionalInteger(formData.get("display_order")) ?? 0,
    image_url: normalizeOptionalString(formData.get("image_url")),
    menu_section_id: normalizeOptionalString(formData.get("menu_section_id")),
    name: String(formData.get("name") ?? "").trim(),
    price_source: "unpriced",
    producer_location: normalizeOptionalString(formData.get("producer_location")),
    producer_name: normalizeOptionalString(formData.get("producer_name")),
    status: parseItemStatus(formData.get("status")),
    style_or_category: normalizeOptionalString(formData.get("style_or_category")),
    type: parseItemType(formData.get("type")),
    venue_id: access.venue.id,
  };

  const { data: item, error } = await supabase.from("items").insert(payload).select("id").single();

  if (error || !item) {
    return { error: error?.message ?? "Unable to create item." };
  }

  const servingError = await replaceItemServings(supabase, access.venue.id, item.id, formData);

  if (servingError) {
    return { error: servingError.message };
  }

  revalidateVenueContent(venueSlug);
  return { message: "Item created." };
}

export async function updateItemAction(venueSlug: string, formData: FormData) {
  const access = await getVenueAccessOrRedirect(venueSlug);

  if (access.isDemoVenue) {
    redirectForDemoVenue(`/app/${venueSlug}/items`);
  }

  const supabase = await createServerSupabaseClient();
  const itemId = String(formData.get("item_id") ?? "");

  const payload: ItemUpdate = {
    abv: parseOptionalNumber(formData.get("abv")),
    active: parseItemStatus(formData.get("status")) !== "hidden",
    description: normalizeOptionalString(formData.get("description")),
    display_order: parseOptionalInteger(formData.get("display_order")) ?? 0,
    image_url: normalizeOptionalString(formData.get("image_url")),
    menu_section_id: normalizeOptionalString(formData.get("menu_section_id")),
    name: String(formData.get("name") ?? "").trim(),
    producer_location: normalizeOptionalString(formData.get("producer_location")),
    producer_name: normalizeOptionalString(formData.get("producer_name")),
    status: parseItemStatus(formData.get("status")),
    style_or_category: normalizeOptionalString(formData.get("style_or_category")),
    type: parseItemType(formData.get("type")),
  };

  const { error } = await supabase.from("items").update(payload).eq("id", itemId).eq("venue_id", access.venue.id);

  if (error) {
    redirect(`/app/${venueSlug}/items?error=${encodeURIComponent(error.message)}`);
  }

  const servingError = await replaceItemServings(supabase, access.venue.id, itemId, formData);

  if (servingError) {
    redirect(`/app/${venueSlug}/items?error=${encodeURIComponent(servingError.message)}`);
  }

  revalidateVenueContent(venueSlug);
  redirect(`/app/${venueSlug}/items?message=${encodeURIComponent("Item updated.")}`);
}

export async function toggleItemActiveAction(venueSlug: string, itemId: string, active: boolean): Promise<void> {
  const access = await getVenueAccessOrRedirect(venueSlug);

  if (access.isDemoVenue) {
    return;
  }

  const supabase = await createServerSupabaseClient();
  await supabase
    .from("items")
    .update({ active, status: active ? "active" : "hidden" })
    .eq("id", itemId)
    .eq("venue_id", access.venue.id);
  revalidateVenueContent(venueSlug);
}

export async function updateItemStatusAction(venueSlug: string, itemId: string, status: ItemStatus): Promise<void> {
  const access = await getVenueAccessOrRedirect(venueSlug);

  if (access.isDemoVenue) {
    return;
  }

  const nextStatus = parseItemStatus(status);
  const supabase = await createServerSupabaseClient();
  await supabase
    .from("items")
    .update({ active: nextStatus !== "hidden", status: nextStatus })
    .eq("id", itemId)
    .eq("venue_id", access.venue.id);
  revalidateVenueContent(venueSlug);
}

export async function deleteItemAction(venueSlug: string, formData: FormData) {
  const access = await getVenueAccessOrRedirect(venueSlug);

  if (access.isDemoVenue) {
    redirectForDemoVenue(`/app/${venueSlug}/items`);
  }

  const supabase = await createServerSupabaseClient();
  const itemId = String(formData.get("item_id") ?? "");

  const { error } = await supabase.from("items").delete().eq("id", itemId).eq("venue_id", access.venue.id);

  if (error) {
    redirect(`/app/${venueSlug}/items?error=${encodeURIComponent(error.message)}`);
  }

  revalidateVenueContent(venueSlug);
  redirect(`/app/${venueSlug}/items?message=${encodeURIComponent("Item removed.")}`);
}

export async function createMenuSectionAction(venueSlug: string, formData: FormData) {
  const access = await getVenueAccessOrRedirect(venueSlug);

  if (access.isDemoVenue) {
    redirectForDemoVenue(`/app/${venueSlug}/items`);
  }

  const supabase = await createServerSupabaseClient();
  const payload: MenuSectionInsert = {
    active: true,
    description: normalizeOptionalString(formData.get("description")),
    display_order: parseOptionalInteger(formData.get("display_order")) ?? 0,
    item_type: parseItemType(formData.get("item_type")),
    name: String(formData.get("name") ?? "").trim(),
    venue_id: access.venue.id,
  };

  const { error } = await supabase.from("menu_sections").insert(payload);

  if (error) {
    redirect(`/app/${venueSlug}/items?error=${encodeURIComponent(error.message)}`);
  }

  revalidateVenueContent(venueSlug);
  redirect(`/app/${venueSlug}/items?message=${encodeURIComponent("Section created.")}`);
}

export async function updateMenuSectionAction(venueSlug: string, formData: FormData) {
  const access = await getVenueAccessOrRedirect(venueSlug);

  if (access.isDemoVenue) {
    redirectForDemoVenue(`/app/${venueSlug}/items`);
  }

  const sectionId = String(formData.get("section_id") ?? "");
  const payload: MenuSectionUpdate = {
    active: String(formData.get("active") ?? "off") === "on",
    description: normalizeOptionalString(formData.get("description")),
    item_type: parseItemType(formData.get("item_type")),
    name: String(formData.get("name") ?? "").trim(),
  };
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("menu_sections")
    .update(payload)
    .eq("id", sectionId)
    .eq("venue_id", access.venue.id);

  if (error) {
    redirect(`/app/${venueSlug}/items?error=${encodeURIComponent(error.message)}`);
  }

  revalidateVenueContent(venueSlug);
  redirect(`/app/${venueSlug}/items?message=${encodeURIComponent("Section updated.")}`);
}

export async function moveMenuSectionAction(venueSlug: string, sectionId: string, direction: "down" | "up") {
  const access = await getVenueAccessOrRedirect(venueSlug);

  if (access.isDemoVenue) {
    return;
  }

  const supabase = await createServerSupabaseClient();
  const { data: sections, error } = await supabase
    .from("menu_sections")
    .select("*")
    .eq("venue_id", access.venue.id)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (error || !sections) {
    return;
  }

  const currentIndex = sections.findIndex((section) => section.id === sectionId);
  const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

  if (currentIndex < 0 || swapIndex < 0 || swapIndex >= sections.length) {
    return;
  }

  const current = sections[currentIndex];
  const target = sections[swapIndex];

  await Promise.all([
    supabase.from("menu_sections").update({ display_order: target.display_order }).eq("id", current.id),
    supabase.from("menu_sections").update({ display_order: current.display_order }).eq("id", target.id),
  ]);
  revalidateVenueContent(venueSlug);
}

export async function deleteMenuSectionAction(venueSlug: string, formData: FormData) {
  const access = await getVenueAccessOrRedirect(venueSlug);

  if (access.isDemoVenue) {
    redirectForDemoVenue(`/app/${venueSlug}/items`);
  }

  const sectionId = String(formData.get("section_id") ?? "");
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("menu_sections")
    .delete()
    .eq("id", sectionId)
    .eq("venue_id", access.venue.id);

  if (error) {
    redirect(`/app/${venueSlug}/items?error=${encodeURIComponent(error.message)}`);
  }

  revalidateVenueContent(venueSlug);
  redirect(`/app/${venueSlug}/items?message=${encodeURIComponent("Section removed.")}`);
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

function parseOptionalMoneyCents(value: FormDataEntryValue | null) {
  const parsed = parseOptionalNumber(value);
  return parsed === null ? null : Math.round(parsed * 100);
}

function normalizeOptionalString(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : null;
}

function parseItemType(value: FormDataEntryValue | null): ItemType {
  const normalized = String(value ?? "pour").trim();
  return ITEM_TYPES.includes(normalized as ItemType) ? (normalized as ItemType) : "pour";
}

function parseItemStatus(value: FormDataEntryValue | ItemStatus | null): ItemStatus {
  const normalized = String(value ?? "active").trim();
  return ITEM_STATUSES.includes(normalized as ItemStatus) ? (normalized as ItemStatus) : "active";
}

async function replaceItemServings(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  venueId: string,
  itemId: string,
  formData: FormData,
) {
  const labels = formData.getAll("serving_label").map((value) => String(value).trim());
  const servingIds = formData.getAll("serving_id").map((value) => String(value).trim());
  const rows = labels
    .map((label, index) => ({
      active: formData.getAll("serving_active")[index] !== "off",
      currency: normalizeCurrency(formData.getAll("serving_currency")[index]),
      display_order: index,
      glassware: normalizeOptionalString(formData.getAll("serving_glassware")[index] ?? null),
      id: servingIds[index] || null,
      item_id: itemId,
      label,
      price_cents: parseOptionalMoneyCents(formData.getAll("serving_price")[index] ?? null),
      size_oz: parseOptionalNumber(formData.getAll("serving_size_oz")[index] ?? null),
      venue_id: venueId,
    }))
    .filter((serving) => serving.label);

  if (rows.length === 0) {
    rows.push({
      active: true,
      currency: "USD",
      display_order: 0,
      glassware: null,
      id: null,
      item_id: itemId,
      label: "Serving",
      price_cents: null,
      size_oz: null,
      venue_id: venueId,
    });
  }

  const keptIds: string[] = [];

  for (const row of rows) {
    const payload: ItemServingInsert | ItemServingUpdate = {
      active: row.active,
      currency: row.currency,
      display_order: row.display_order,
      glassware: row.glassware,
      item_id: itemId,
      label: row.label,
      price_cents: row.price_cents,
      size_oz: row.size_oz,
      venue_id: venueId,
    };

    if (row.id) {
      const { error } = await supabase
        .from("item_servings")
        .update(payload)
        .eq("id", row.id)
        .eq("item_id", itemId)
        .eq("venue_id", venueId);

      if (error) {
        return error;
      }

      keptIds.push(row.id);
    } else {
      const { data, error } = await supabase
        .from("item_servings")
        .insert(payload as ItemServingInsert)
        .select("id")
        .single();

      if (error || !data) {
        return error ?? new Error("Unable to save serving.");
      }

      keptIds.push(data.id);
    }
  }

  let deleteQuery = supabase
    .from("item_servings")
    .delete()
    .eq("item_id", itemId)
    .eq("venue_id", venueId);

  if (keptIds.length > 0) {
    deleteQuery = deleteQuery.not("id", "in", `(${keptIds.join(",")})`);
  }

  const { error: deleteError } = await deleteQuery;
  return deleteError;
}

function normalizeCurrency(value: FormDataEntryValue | null | undefined) {
  const normalized = String(value ?? "USD").trim().toUpperCase();
  return /^[A-Z]{3}$/.test(normalized) ? normalized : "USD";
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

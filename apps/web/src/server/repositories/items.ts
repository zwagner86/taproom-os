import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "../../../../../supabase/types";

export type MenuSectionRecord = Database["public"]["Tables"]["menu_sections"]["Row"];
export type ItemServingRecord = Database["public"]["Tables"]["item_servings"]["Row"] & {
  item_serving_external_links: Database["public"]["Tables"]["item_serving_external_links"]["Row"][];
};
export type VenueItemRecord = Database["public"]["Tables"]["items"]["Row"] & {
  item_external_links: Database["public"]["Tables"]["item_external_links"]["Row"][];
  item_servings: ItemServingRecord[];
  menu_sections: MenuSectionRecord | null;
};

export async function listVenueItems(venueId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("items")
    .select("*, menu_sections(*), item_servings(*, item_serving_external_links(*)), item_external_links(*)")
    .eq("venue_id", venueId)
    .order("display_order", { ascending: true, referencedTable: "item_servings" })
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as VenueItemRecord[];
}

export async function listPublicVenueItems(slug: string) {
  const supabase = await createServerSupabaseClient();
  const { data: venue, error: venueError } = await supabase.from("venues").select("*").eq("slug", slug).maybeSingle();

  if (venueError) {
    throw venueError;
  }

  if (!venue) {
    return { items: [], venue: null };
  }

  const { data: items, error } = await supabase
    .from("items")
    .select("*, menu_sections(*), item_servings(*, item_serving_external_links(*)), item_external_links(*)")
    .eq("venue_id", venue.id)
    .in("status", ["active", "coming_soon"])
    .order("display_order", { ascending: true, referencedTable: "item_servings" })
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return {
    items: (items ?? []) as VenueItemRecord[],
    venue,
  };
}

export async function listVenueMenuSections(venueId: string, includeInactive = true) {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("menu_sections")
    .select("*")
    .eq("venue_id", venueId)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (!includeInactive) {
    query = query.eq("active", true);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as MenuSectionRecord[];
}

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function listVenueItems(venueId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("items")
    .select("*, item_external_links(*)")
    .eq("venue_id", venueId)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return data;
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
    .select("*, item_external_links(*)")
    .eq("venue_id", venue.id)
    .eq("active", true)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return {
    items,
    venue,
  };
}


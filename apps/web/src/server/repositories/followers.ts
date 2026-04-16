import type { Database } from "../../../../../supabase/types";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";

type FollowerInsert = Database["public"]["Tables"]["followers"]["Insert"];

export async function listVenueFollowers(venueId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("followers")
    .select("*")
    .eq("venue_id", venueId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

export async function listVenueFollowersAdmin(venueId: string) {
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("followers")
    .select("*")
    .eq("venue_id", venueId)
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

export async function upsertFollowerAdmin(input: FollowerInsert) {
  const supabase = await createAdminSupabaseClient();

  const existing = input.email
    ? await supabase
        .from("followers")
        .select("*")
        .eq("venue_id", input.venue_id)
        .eq("email", input.email)
        .maybeSingle()
    : input.phone
      ? await supabase
          .from("followers")
          .select("*")
          .eq("venue_id", input.venue_id)
          .eq("phone", input.phone)
          .maybeSingle()
      : { data: null, error: null };

  if (existing.error) {
    throw existing.error;
  }

  if (existing.data) {
    const { data, error } = await supabase
      .from("followers")
      .update({
        active: true,
        channel_preferences: input.channel_preferences ?? existing.data.channel_preferences,
        consented_at: new Date().toISOString(),
        email: input.email ?? existing.data.email,
        phone: input.phone ?? existing.data.phone,
      })
      .eq("id", existing.data.id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  const { data, error } = await supabase.from("followers").insert(input).select("*").single();

  if (error) {
    throw error;
  }

  return data;
}

import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import type { Database } from "../../../../../supabase/types";
import { isDemoVenueRecord } from "@/lib/demo-venue";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getOptionalUser, isPlatformAdmin } from "@/server/auth";

export type VenueRow = Database["public"]["Tables"]["venues"]["Row"];
export type VenueUserRow = Database["public"]["Tables"]["venue_users"]["Row"];

export async function listVenuesForUser(user: User) {
  const supabase = await createServerSupabaseClient();
  const admin = await isPlatformAdmin();

  if (admin) {
    const { data, error } = await supabase
      .from("venues")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      throw error;
    }

    return data;
  }

  const { data, error } = await supabase
    .from("venue_users")
    .select("venue_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  const venueIds = data.map((record) => record.venue_id);

  if (venueIds.length === 0) {
    return [];
  }

  const { data: venues, error: venuesError } = await supabase
    .from("venues")
    .select("*")
    .in("id", venueIds)
    .order("name", { ascending: true });

  if (venuesError) {
    throw venuesError;
  }

  return venues as VenueRow[];
}

export async function getVenueBySlug(slug: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("venues").select("*").eq("slug", slug).maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function requireVenueAccess(slug: string) {
  const [user, venue, admin] = await Promise.all([
    getOptionalUser(),
    getVenueBySlug(slug),
    isPlatformAdmin(),
  ]);

  if (!user) {
    redirect("/login");
  }

  if (!venue) {
    redirect("/");
  }

  if (admin) {
    return {
      isDemoVenue: isDemoVenueRecord(venue),
      isPlatformAdmin: true,
      membership: null,
      user,
      venue,
    };
  }

  const supabase = await createServerSupabaseClient();
  const membershipResponse = await supabase
    .from("venue_users")
    .select("*")
    .eq("venue_id", venue.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membershipResponse.data) {
    redirect("/");
  }

  return {
    isDemoVenue: isDemoVenueRecord(venue),
    isPlatformAdmin: false,
    membership: membershipResponse.data,
    user,
    venue,
  };
}

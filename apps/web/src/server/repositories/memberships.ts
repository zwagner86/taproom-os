import type { Database } from "../../../../../supabase/types";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";

type MembershipPlanInsert = Database["public"]["Tables"]["membership_plans"]["Insert"];
type MembershipPlanUpdate = Database["public"]["Tables"]["membership_plans"]["Update"];
type MembershipInsert = Database["public"]["Tables"]["memberships"]["Insert"];
type MembershipUpdate = Database["public"]["Tables"]["memberships"]["Update"];

export async function listVenueMembershipPlans(venueId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("membership_plans")
    .select("*")
    .eq("venue_id", venueId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data;
}

export async function listVenueMemberships(venueId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("memberships")
    .select("*, membership_plans(name)")
    .eq("venue_id", venueId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

export async function listPublicMembershipPlans(slug: string) {
  const supabase = await createServerSupabaseClient();
  const { data: venue, error: venueError } = await supabase.from("venues").select("*").eq("slug", slug).maybeSingle();

  if (venueError) {
    throw venueError;
  }

  if (!venue) {
    return { plans: [], venue: null };
  }

  const { data, error } = await supabase
    .from("membership_plans")
    .select("*")
    .eq("venue_id", venue.id)
    .eq("active", true)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return { plans: data, venue };
}

export async function getMembershipPlanById(venueId: string, planId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("membership_plans")
    .select("*")
    .eq("venue_id", venueId)
    .eq("id", planId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getMembershipById(venueId: string, membershipId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("memberships")
    .select("*")
    .eq("venue_id", venueId)
    .eq("id", membershipId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getMembershipByIdAdmin(membershipId: string) {
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase.from("memberships").select("*").eq("id", membershipId).maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getMembershipByCheckoutSessionIdAdmin(_sessionId: string) {
  return null;
}

export async function getMembershipBySubscriptionIdAdmin(subscriptionId: string) {
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("memberships")
    .select("*")
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function createMembershipPlanAdmin(input: MembershipPlanInsert) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("membership_plans").insert(input).select("*").single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateMembershipPlanAdmin(venueId: string, planId: string, updates: MembershipPlanUpdate) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("membership_plans")
    .update(updates)
    .eq("venue_id", venueId)
    .eq("id", planId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function createMembershipAdmin(input: MembershipInsert) {
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase.from("memberships").insert(input).select("*").single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateMembershipAdmin(membershipId: string, updates: MembershipUpdate) {
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("memberships")
    .update(updates)
    .eq("id", membershipId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

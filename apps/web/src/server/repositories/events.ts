import type { Database } from "../../../../../supabase/types";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";

type EventInsert = Database["public"]["Tables"]["events"]["Insert"];
type EventUpdate = Database["public"]["Tables"]["events"]["Update"];
type EventBookingInsert = Database["public"]["Tables"]["event_bookings"]["Insert"];
type EventBookingUpdate = Database["public"]["Tables"]["event_bookings"]["Update"];
type CheckInSessionInsert = Database["public"]["Tables"]["event_check_in_sessions"]["Insert"];
type CheckInEventInsert = Database["public"]["Tables"]["check_in_events"]["Insert"];

export async function listVenueEvents(venueId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("venue_id", venueId)
    .order("starts_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data;
}

export async function listPublicVenueEvents(slug: string) {
  const supabase = await createServerSupabaseClient();
  const { data: venue, error: venueError } = await supabase.from("venues").select("*").eq("slug", slug).maybeSingle();

  if (venueError) {
    throw venueError;
  }

  if (!venue) {
    return { events: [], venue: null };
  }

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("venue_id", venue.id)
    .eq("published", true)
    .eq("status", "published")
    .order("starts_at", { ascending: true });

  if (error) {
    throw error;
  }

  return { events: data, venue };
}

export async function getVenueEventById(venueId: string, eventId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("venue_id", venueId)
    .eq("id", eventId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getVenueEventByIdAdmin(eventId: string) {
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase.from("events").select("*").eq("id", eventId).maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getPublicVenueEventByKey(slug: string, eventKey: string) {
  const { venue, events } = await listPublicVenueEvents(slug);
  return {
    event: events.find((entry) => entry.id === eventKey || entry.slug === eventKey) ?? null,
    venue,
  };
}

export const getPublicVenueEventBySlug = getPublicVenueEventByKey;

export async function listEventBookings(venueId: string, eventId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("event_bookings")
    .select("*")
    .eq("venue_id", venueId)
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data;
}

export async function listEventBookingsAdmin(eventId: string) {
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("event_bookings")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data;
}

export async function getEventBookingById(venueId: string, bookingId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("event_bookings")
    .select("*")
    .eq("venue_id", venueId)
    .eq("id", bookingId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getEventBookingByIdAdmin(bookingId: string) {
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase.from("event_bookings").select("*").eq("id", bookingId).maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getEventBookingByCheckoutSessionIdAdmin(sessionId: string) {
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("event_bookings")
    .select("*")
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getEventBookingByChargeIdAdmin(chargeId: string) {
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("event_bookings")
    .select("*")
    .eq("stripe_charge_id", chargeId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function createEventAdmin(input: EventInsert) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("events").insert(input).select("*").single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateEventAdmin(venueId: string, eventId: string, updates: EventUpdate) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("events")
    .update(updates)
    .eq("venue_id", venueId)
    .eq("id", eventId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function createEventBookingAdmin(input: EventBookingInsert) {
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase.from("event_bookings").insert(input).select("*").single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateEventBookingAdmin(bookingId: string, updates: EventBookingUpdate) {
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("event_bookings")
    .update(updates)
    .eq("id", bookingId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getReservedBookingCountForEvent(eventId: string) {
  const supabase = await createAdminSupabaseClient();
  const cutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("event_bookings")
    .select("party_size, booking_status, created_at")
    .eq("event_id", eventId)
    .neq("booking_status", "cancelled");

  if (error) {
    throw error;
  }

  return (data ?? []).reduce((total, booking) => {
    if (booking.booking_status === "confirmed") {
      return total + booking.party_size;
    }

    if (booking.booking_status === "pending" && booking.created_at >= cutoff) {
      return total + booking.party_size;
    }

    return total;
  }, 0);
}

export async function getCheckInSessionForEvent(venueId: string, eventId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("event_check_in_sessions")
    .select("*")
    .eq("venue_id", venueId)
    .eq("event_id", eventId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getCheckInSessionByTokenAdmin(token: string) {
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("event_check_in_sessions")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function createCheckInSessionAdmin(input: CheckInSessionInsert) {
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("event_check_in_sessions")
    .insert(input)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function createCheckInEventAdmin(input: CheckInEventInsert) {
  const supabase = await createAdminSupabaseClient();
  const { error } = await supabase.from("check_in_events").insert(input);

  if (error) {
    throw error;
  }
}

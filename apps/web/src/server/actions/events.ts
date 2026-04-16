"use server";

import { applyCheckInDelta, hasCapacityRemaining } from "@taproom/domain";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { Database } from "../../../../../supabase/types";
import { getEnv } from "@/env";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import { getPaymentsProvider } from "@/server/providers";
import {
  createCheckInEventAdmin,
  createCheckInSessionAdmin,
  createEventAdmin,
  createEventBookingAdmin,
  getCheckInSessionByTokenAdmin,
  getCheckInSessionForEvent,
  getEventBookingById,
  getEventBookingByIdAdmin,
  getReservedBookingCountForEvent,
  getVenueEventById,
  listEventBookings,
  listPublicVenueEvents,
  updateEventAdmin,
  updateEventBookingAdmin,
} from "@/server/repositories/events";
import { getStripeConnectionForVenue } from "@/server/repositories/providers";
import { requireVenueAccess } from "@/server/repositories/venues";
import { sendEmailFirstNotification } from "@/server/services/notifications";

type EventInsert = Database["public"]["Tables"]["events"]["Insert"];
type EventUpdate = Database["public"]["Tables"]["events"]["Update"];

export async function createEventAction(venueSlug: string, formData: FormData) {
  const access = await requireVenueAccess(venueSlug);
  const payload = buildCreateEventPayload(access.venue.id, formData);

  try {
    await createEventAdmin(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create event.";
    redirect(`/app/${venueSlug}/events?error=${encodeURIComponent(message)}`);
  }

  revalidateEventPaths(venueSlug);
  redirect(`/app/${venueSlug}/events?message=${encodeURIComponent("Event created.")}`);
}

export async function updateEventAction(venueSlug: string, formData: FormData) {
  const access = await requireVenueAccess(venueSlug);
  const eventId = String(formData.get("event_id") ?? "");
  const existing = await getVenueEventById(access.venue.id, eventId);

  if (!existing) {
    redirect(`/app/${venueSlug}/events?error=${encodeURIComponent("Event not found.")}`);
  }

  const updates = buildUpdateEventPayload(formData);

  try {
    const updated = await updateEventAdmin(access.venue.id, eventId, updates);

    if (existing.status !== "cancelled" && updated.status === "cancelled") {
      const bookings = await listEventBookings(access.venue.id, eventId);

      for (const booking of bookings.filter((entry) => entry.booking_status === "confirmed")) {
        if (!booking.purchaser_email) {
          continue;
        }

        await sendEmailFirstNotification({
          contextId: booking.id,
          contextType: "event_booking",
          email: booking.purchaser_email,
          emailBody: `${access.venue.name} cancelled ${updated.title}. Your booking has been marked for refund review in TaproomOS.`,
          subject: `${updated.title} was cancelled`,
          templateKey: "event_cancellation",
          venueId: access.venue.id,
        });
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save event.";
    redirect(`/app/${venueSlug}/events?error=${encodeURIComponent(message)}`);
  }

  revalidateEventPaths(venueSlug, eventId, existing.slug);
  redirect(`/app/${venueSlug}/events?message=${encodeURIComponent("Event updated.")}`);
}

export async function createFreeEventBookingAction(venueSlug: string, eventSlug: string, formData: FormData) {
  const { event, venue } = await getPublicEventOrRedirect(venueSlug, eventSlug);
  const partySize = parsePositiveInteger(formData.get("party_size")) ?? 1;
  const reservedCount = await getReservedBookingCountForEvent(event.id);

  if (!hasCapacityRemaining(event.capacity, reservedCount, partySize)) {
    redirect(`/v/${venueSlug}/events/${eventSlug}?error=${encodeURIComponent("That event is sold out.")}`);
  }

  const booking = await createEventBookingAdmin({
    booking_status: "confirmed",
    checked_in_count: 0,
    confirmed_at: new Date().toISOString(),
    currency: event.currency,
    event_id: event.id,
    party_size: partySize,
    payment_status: "unpaid",
    purchaser_email: normalizeOptionalString(formData.get("purchaser_email")),
    purchaser_name: String(formData.get("purchaser_name") ?? "").trim(),
    purchaser_phone: normalizeOptionalString(formData.get("purchaser_phone")),
    stripe_checkout_session_id: null,
    stripe_payment_intent_id: null,
    total_price_cents: 0,
    unit_price_cents: 0,
    venue_id: venue.id,
  });

  if (booking.purchaser_email) {
    await sendEmailFirstNotification({
      contextId: booking.id,
      contextType: "event_booking",
      email: booking.purchaser_email,
      emailBody: `${venue.name} confirmed your RSVP for ${event.title} on ${new Date(event.starts_at).toLocaleString()}. Party size: ${booking.party_size}.`,
      subject: `RSVP confirmed for ${event.title}`,
      templateKey: "event_rsvp_confirmation",
      venueId: venue.id,
    });
  }

  revalidateEventPaths(venueSlug, event.id, event.slug);
  redirect(`/v/${venueSlug}/events/${eventSlug}?message=${encodeURIComponent("RSVP confirmed.")}`);
}

export async function createPaidEventCheckoutAction(venueSlug: string, eventSlug: string, formData: FormData) {
  const { event, venue } = await getPublicEventOrRedirect(venueSlug, eventSlug);
  const connection = await getStripeConnectionForVenue(venue.id);

  if (!connection?.stripe_account_id) {
    redirect(`/v/${venueSlug}/events/${eventSlug}?error=${encodeURIComponent("Payments are not connected for this venue yet.")}`);
  }

  if (event.price_cents === null) {
    redirect(`/v/${venueSlug}/events/${eventSlug}?error=${encodeURIComponent("This event does not require paid checkout.")}`);
  }

  const partySize = parsePositiveInteger(formData.get("party_size")) ?? 1;
  const reservedCount = await getReservedBookingCountForEvent(event.id);

  if (!hasCapacityRemaining(event.capacity, reservedCount, partySize)) {
    redirect(`/v/${venueSlug}/events/${eventSlug}?error=${encodeURIComponent("That event is sold out.")}`);
  }

  const booking = await createEventBookingAdmin({
    booking_status: "pending",
    checked_in_count: 0,
    currency: event.currency,
    event_id: event.id,
    party_size: partySize,
    payment_status: "unpaid",
    purchaser_email: normalizeOptionalString(formData.get("purchaser_email")),
    purchaser_name: String(formData.get("purchaser_name") ?? "").trim(),
    purchaser_phone: normalizeOptionalString(formData.get("purchaser_phone")),
    total_price_cents: event.price_cents * partySize,
    unit_price_cents: event.price_cents,
    venue_id: venue.id,
  });

  try {
    const session = await getPaymentsProvider().createEventCheckoutSession({
      amountCents: booking.total_price_cents,
      applicationFeePercent: getEnv().STRIPE_APPLICATION_FEE_PERCENT,
      cancelUrl: `${getEnv().NEXT_PUBLIC_APP_URL}/v/${venueSlug}/events/${eventSlug}?checkout=cancel`,
      connectedAccountId: connection.stripe_account_id,
      currency: event.currency,
      customerEmail: booking.purchaser_email ?? undefined,
      lineItemName: `${event.title} x${partySize}`,
      metadata: {
        booking_id: booking.id,
        event_id: event.id,
        event_slug: event.slug,
        venue_id: venue.id,
        venue_slug: venueSlug,
      },
      successUrl: `${getEnv().NEXT_PUBLIC_APP_URL}/v/${venueSlug}/events/${eventSlug}?checkout=success`,
      venueId: venue.id,
      venueName: venue.name,
    });

    await updateEventBookingAdmin(booking.id, {
      stripe_checkout_session_id: session.sessionId,
    });

    redirect(session.checkoutUrl);
  } catch (error) {
    await updateEventBookingAdmin(booking.id, {
      booking_status: "cancelled",
      cancelled_at: new Date().toISOString(),
    });

    const message = error instanceof Error ? error.message : "Unable to start checkout.";
    redirect(`/v/${venueSlug}/events/${eventSlug}?error=${encodeURIComponent(message)}`);
  }
}

export async function createCheckInSessionAction(venueSlug: string, eventId: string, formData: FormData) {
  const access = await requireVenueAccess(venueSlug);
  const existing = await getCheckInSessionForEvent(access.venue.id, eventId);

  if (existing) {
    redirect(`/app/${venueSlug}/events/${eventId}/check-in?message=${encodeURIComponent("Shared session already exists.")}`);
  }

  try {
    await createCheckInSessionAdmin({
      created_by_user_id: access.user.id,
      event_id: eventId,
      pin: normalizeOptionalString(formData.get("pin")),
      session_name: String(formData.get("session_name") ?? "Shared check-in").trim() || "Shared check-in",
      venue_id: access.venue.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create check-in session.";
    redirect(`/app/${venueSlug}/events/${eventId}/check-in?error=${encodeURIComponent(message)}`);
  }

  revalidateEventPaths(venueSlug, eventId);
  redirect(`/app/${venueSlug}/events/${eventId}/check-in?message=${encodeURIComponent("Shared session created.")}`);
}

export async function adjustCheckInAction(venueSlug: string, eventId: string, formData: FormData) {
  const access = await requireVenueAccess(venueSlug);
  const bookingId = String(formData.get("booking_id") ?? "");
  const delta = parseDelta(formData.get("delta"));
  const booking = await getEventBookingById(access.venue.id, bookingId);

  if (!booking) {
    redirect(`/app/${venueSlug}/events/${eventId}/check-in?error=${encodeURIComponent("Booking not found.")}`);
  }

  const nextCount = applyCheckInDelta(booking.checked_in_count, booking.party_size, delta);

  await updateEventBookingAdmin(booking.id, {
    checked_in_count: nextCount,
  });
  await createCheckInEventAdmin({
    actor_reference: access.user.id,
    actor_type: "venue_user",
    booking_id: booking.id,
    delta,
    venue_id: access.venue.id,
  });

  revalidateEventPaths(venueSlug, eventId);
  redirect(`/app/${venueSlug}/events/${eventId}/check-in?message=${encodeURIComponent("Check-in updated.")}`);
}

export async function adjustCheckInWithTokenAction(token: string, formData: FormData) {
  const session = await getCheckInSessionByTokenAdmin(token);

  if (!session) {
    redirect(`/check-in/${token}?error=${encodeURIComponent("Shared session not found.")}`);
  }

  const providedPin = normalizeOptionalString(formData.get("pin"));

  if (session.pin && session.pin !== providedPin) {
    redirect(`/check-in/${token}?error=${encodeURIComponent("PIN does not match.")}`);
  }

  const booking = await getEventBookingByIdAdmin(String(formData.get("booking_id") ?? ""));

  if (!booking || booking.event_id !== session.event_id) {
    redirect(`/check-in/${token}?error=${encodeURIComponent("Booking not found.")}`);
  }

  const delta = parseDelta(formData.get("delta"));
  const nextCount = applyCheckInDelta(booking.checked_in_count, booking.party_size, delta);

  await updateEventBookingAdmin(booking.id, {
    checked_in_count: nextCount,
  });
  await createCheckInEventAdmin({
    actor_reference: session.token,
    actor_type: "shared_session",
    booking_id: booking.id,
    delta,
    venue_id: booking.venue_id,
  });

  revalidatePath(`/check-in/${token}`);
  redirect(`/check-in/${token}?message=${encodeURIComponent("Check-in updated.")}`);
}

export async function refundEventBookingAction(venueSlug: string, bookingId: string) {
  const access = await requireVenueAccess(venueSlug);
  const booking = await getEventBookingById(access.venue.id, bookingId);
  const connection = await getStripeConnectionForVenue(access.venue.id);

  if (!booking) {
    redirect(`/app/${venueSlug}/billing?error=${encodeURIComponent("Booking not found.")}`);
  }

  if (!connection?.stripe_account_id || !booking.stripe_charge_id) {
    redirect(`/app/${venueSlug}/billing?error=${encodeURIComponent("That booking is not eligible for Stripe refunding.")}`);
  }

  try {
    await getPaymentsProvider().refundCharge(connection.stripe_account_id, booking.stripe_charge_id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to process refund.";
    redirect(`/app/${venueSlug}/billing?error=${encodeURIComponent(message)}`);
  }

  redirect(`/app/${venueSlug}/billing?message=${encodeURIComponent("Refund requested. Stripe will confirm it shortly.")}`);
}

function buildCreateEventPayload(venueId: string, formData: FormData): EventInsert {
  const title = String(formData.get("title") ?? "").trim();
  const status = String(formData.get("status") ?? "draft");
  const published = status === "published";

  return {
    capacity: parseOptionalInteger(formData.get("capacity")),
    currency: String(formData.get("currency") ?? "USD").trim().toUpperCase() || "USD",
    description: normalizeOptionalString(formData.get("description")),
    ends_at: normalizeOptionalDate(formData.get("ends_at")),
    image_url: normalizeOptionalString(formData.get("image_url")),
    price_cents: parseOptionalInteger(formData.get("price_cents")),
    published,
    slug: slugify(String(formData.get("slug") ?? title)),
    starts_at: normalizeRequiredDate(formData.get("starts_at")),
    status,
    title,
    venue_id: venueId,
  };
}

function buildUpdateEventPayload(formData: FormData): EventUpdate {
  const title = String(formData.get("title") ?? "").trim();
  const status = String(formData.get("status") ?? "draft");
  const published = status === "published";

  return {
    capacity: parseOptionalInteger(formData.get("capacity")),
    currency: String(formData.get("currency") ?? "USD").trim().toUpperCase() || "USD",
    description: normalizeOptionalString(formData.get("description")),
    ends_at: normalizeOptionalDate(formData.get("ends_at")),
    image_url: normalizeOptionalString(formData.get("image_url")),
    price_cents: parseOptionalInteger(formData.get("price_cents")),
    published,
    slug: slugify(String(formData.get("slug") ?? title)),
    starts_at: normalizeRequiredDate(formData.get("starts_at")),
    status,
    title,
  };
}

async function getPublicEventOrRedirect(venueSlug: string, eventSlug: string) {
  const { event, venue } = await (async () => {
    const publicData = await listPublicVenueEvents(venueSlug);
    return {
      event: publicData.events.find((entry) => entry.slug === eventSlug) ?? null,
      venue: publicData.venue,
    };
  })();

  if (!event || !venue) {
    redirect(`/v/${venueSlug}/events?error=${encodeURIComponent("Event not found.")}`);
  }

  return { event, venue };
}

function parseOptionalInteger(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    return null;
  }
  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parsePositiveInteger(value: FormDataEntryValue | null) {
  const parsed = parseOptionalInteger(value);
  return parsed && parsed > 0 ? parsed : null;
}

function normalizeOptionalString(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeRequiredDate(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  return new Date(normalized).toISOString();
}

function normalizeOptionalDate(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  return normalized ? new Date(normalized).toISOString() : null;
}

function parseDelta(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();

  if (normalized === "all") {
    return Number.MAX_SAFE_INTEGER;
  }

  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) ? parsed : 1;
}

function revalidateEventPaths(venueSlug: string, eventId?: string, eventSlug?: string) {
  revalidatePath(`/app/${venueSlug}/events`);
  revalidatePath(`/v/${venueSlug}/events`);
  revalidatePath(`/embed/${venueSlug}/events`);

  if (eventId) {
    revalidatePath(`/app/${venueSlug}/events/${eventId}/check-in`);
  }

  if (eventSlug) {
    revalidatePath(`/v/${venueSlug}/events/${eventSlug}`);
  }
}

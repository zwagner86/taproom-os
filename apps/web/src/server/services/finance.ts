import { calculateApplicationFee } from "@taproom/domain";

import { getEnv } from "@/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function buildVenueFinanceLedger(venueId: string) {
  const supabase = await createServerSupabaseClient();
  const feePercent = getEnv().STRIPE_APPLICATION_FEE_PERCENT;

  const [{ data: bookings, error: bookingsError }, { data: memberships, error: membershipsError }] =
    await Promise.all([
      supabase
        .from("event_bookings")
        .select("*, events(title)")
        .eq("venue_id", venueId)
        .or("payment_status.eq.paid,payment_status.eq.refunded")
        .order("updated_at", { ascending: false })
        .limit(100),
      supabase
        .from("memberships")
        .select("*, membership_plans(name)")
        .eq("venue_id", venueId)
        .neq("status", "pending")
        .order("updated_at", { ascending: false })
        .limit(100),
    ]);

  if (bookingsError) {
    throw bookingsError;
  }

  if (membershipsError) {
    throw membershipsError;
  }

  const bookingEntries = (bookings ?? []).flatMap((booking) => {
    const baseAmount = booking.total_price_cents;
    const entries = [];

    if (booking.payment_status === "paid" || booking.payment_status === "refunded") {
      entries.push({
        amountCents: baseAmount,
        contextId: booking.id,
        contextType: "event_booking",
        currency: booking.currency,
        feeCents: calculateApplicationFee(baseAmount, feePercent),
        id: `event-booking-${booking.id}`,
        occurredAt: booking.confirmed_at ?? booking.updated_at,
        status: booking.payment_status,
        title: `${booking.events?.title ?? "Event"} booking`,
        type: "event_booking" as const,
        venueId,
      });
    }

    if (booking.refunded_amount_cents > 0) {
      entries.push({
        amountCents: booking.refunded_amount_cents * -1,
        contextId: booking.id,
        contextType: "event_booking",
        currency: booking.currency,
        feeCents: calculateApplicationFee(booking.refunded_amount_cents, feePercent),
        id: `event-refund-${booking.id}`,
        occurredAt: booking.updated_at,
        status: "refunded",
        title: `${booking.events?.title ?? "Event"} refund`,
        type: "refund" as const,
        venueId,
      });
    }

    return entries;
  });

  const membershipEntries = (memberships ?? []).map((membership) => ({
    amountCents: membership.price_cents ?? 0,
    contextId: membership.id,
    contextType: "membership",
    currency: membership.currency,
    feeCents: calculateApplicationFee(membership.price_cents ?? 0, feePercent),
    id: `membership-${membership.id}`,
    occurredAt: membership.created_at,
    status: membership.status,
    title: membership.plan_name_snapshot ?? membership.membership_plans?.name ?? "Membership",
    type: "membership" as const,
    venueId,
  }));

  return [...bookingEntries, ...membershipEntries].sort((left, right) =>
    right.occurredAt.localeCompare(left.occurredAt),
  );
}

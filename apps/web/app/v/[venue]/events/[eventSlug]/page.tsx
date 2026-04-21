export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";

import { Badge, Button, Card, Input, Label } from "@taproom/ui";

import { PublicFollowCard } from "@/components/public-follow-card";
import { getPaidEventGateCopy } from "@/lib/venue-payment-capability";
import { createFreeEventBookingAction, createPaidEventCheckoutAction } from "@/server/actions/events";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getPublicVenueEventBySlug } from "@/server/repositories/events";
import { getVenuePaymentCapability } from "@/server/services/payment-capability";

export default async function PublicEventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventSlug: string; venue: string }>;
  searchParams: Promise<{ checkout?: string; error?: string; message?: string }>;
}) {
  const { eventSlug, venue } = await params;
  const { checkout, error, message } = await searchParams;
  const { event, venue: venueRecord } = await getPublicVenueEventBySlug(venue, eventSlug);

  if (!venueRecord || !event) {
    notFound();
  }

  const paymentCapability = await getVenuePaymentCapability(venueRecord.id);
  const paidEventUnavailable = event.price_cents !== null && !paymentCapability.canSellPaidEvents;
  const rsvpAction = createFreeEventBookingAction.bind(null, venue, eventSlug);
  const paidAction = createPaidEventCheckoutAction.bind(null, venue, eventSlug);
  const isFree = event.price_cents === null || event.price_cents === 0;

  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      {/* Event header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="accent">Event</Badge>
          {isFree ? (
            <Badge variant="success">Free RSVP</Badge>
          ) : (
            <Badge variant="info">{formatCurrency(event.price_cents!, event.currency)}</Badge>
          )}
        </div>

        <h1
          className="text-[34px] font-black tracking-[-0.8px] mb-4"
          style={{ color: "var(--c-text)", fontFamily: "Lora, serif" }}
        >
          {event.title}
        </h1>

        {/* Structured meta row */}
        <div
          className="flex flex-wrap gap-x-8 gap-y-3 py-4 border-y"
          style={{ borderColor: "var(--c-border)" }}
        >
          <div>
            <div
              className="text-[11px] font-bold uppercase tracking-[0.8px] mb-1"
              style={{ color: "var(--c-muted)" }}
            >
              Date &amp; Time
            </div>
            <div className="text-[14px] font-semibold" style={{ color: "var(--c-text)" }}>
              {formatDate(event.starts_at)}
            </div>
          </div>
          <div>
            <div
              className="text-[11px] font-bold uppercase tracking-[0.8px] mb-1"
              style={{ color: "var(--c-muted)" }}
            >
              Capacity
            </div>
            <div className="text-[14px] font-semibold" style={{ color: "var(--c-text)" }}>
              {event.capacity ?? "Open"}
            </div>
          </div>
          <div>
            <div
              className="text-[11px] font-bold uppercase tracking-[0.8px] mb-1"
              style={{ color: "var(--c-muted)" }}
            >
              Price
            </div>
            <div className="text-[14px] font-semibold" style={{ color: "var(--c-text)" }}>
              {isFree ? "Free" : formatCurrency(event.price_cents!, event.currency)}
            </div>
          </div>
        </div>

        {event.description && (
          <p className="text-[15px] leading-relaxed mt-4" style={{ color: "var(--c-text)" }}>
            {event.description}
          </p>
        )}
      </div>

      {checkout === "success" && (
        <div className="mb-5 rounded-[10px] border border-green-200 bg-green-50 px-4 py-3 text-[13px] text-green-800">
          Checkout completed. Your confirmation will appear shortly.
        </div>
      )}
      {checkout === "cancel" && (
        <div className="mb-5 rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
          Checkout was canceled before payment completed.
        </div>
      )}
      {message && (
        <div className="mb-5 rounded-[10px] border border-green-200 bg-green-50 px-4 py-3 text-[13px] text-green-800">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-5 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
          {error}
        </div>
      )}

      {paidEventUnavailable ? (
        <Card style={{ marginBottom: 24 }}>
          <div className="font-semibold mb-2" style={{ color: "var(--c-text)" }}>Paid ticketing is unavailable right now.</div>
          <p className="text-[13.5px] leading-relaxed" style={{ color: "var(--c-muted)" }}>
            {getPaidEventGateCopy()} This venue can still use TaproomOS for menus, free events, displays, follows,
            and Square-linked catalog management.
          </p>
        </Card>
      ) : (
        <Card style={{ marginBottom: 24 }}>
          <div className="text-sm font-semibold mb-4" style={{ color: "var(--c-text)" }}>
            {isFree ? "RSVP for this event" : "Reserve your spot"}
          </div>
          <form action={isFree ? rsvpAction : paidAction} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="booking-name">Your name <span style={{ color: "var(--accent)" }}>*</span></Label>
              <Input id="booking-name" name="purchaser_name" placeholder="Sam Taproom" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <Label htmlFor="booking-email">Email</Label>
                <Input id="booking-email" name="purchaser_email" placeholder="sam@example.com" type="email" />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="booking-phone">Phone</Label>
                <Input id="booking-phone" name="purchaser_phone" placeholder="+1 555 123 4567" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="booking-party-size">Party size</Label>
              <Input defaultValue="1" id="booking-party-size" min="1" name="party_size" style={{ width: 100 }} type="number" />
            </div>
            <Button className="w-full" type="submit">
              {isFree ? "Confirm RSVP" : "Continue to checkout"}
            </Button>
          </form>
        </Card>
      )}

      <PublicFollowCard returnPath={`/v/${venue}/events/${eventSlug}`} venueSlug={venue} />
    </main>
  );
}

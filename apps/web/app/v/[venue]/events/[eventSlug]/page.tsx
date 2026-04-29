export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";

import { Alert, Badge, Button, Card, Input, Label } from "@/components/ui";
import { PublicFollowCard } from "@/components/public-follow-card";
import { PublicPageAttribution } from "@/components/public-page-attribution";
import { getPaidEventGateCopy } from "@/lib/venue-payment-capability";
import { createFreeEventBookingAction, createPaidEventCheckoutAction } from "@/server/actions/events";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getPublicVenueEventByKey } from "@/server/repositories/events";
import { getVenuePaymentCapability } from "@/server/services/payment-capability";

export default async function PublicEventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventSlug: string; venue: string }>;
  searchParams: Promise<{ checkout?: string; error?: string; message?: string }>;
}) {
  const { eventSlug: eventKey, venue } = await params;
  const { checkout, error, message } = await searchParams;
  const { event, venue: venueRecord } = await getPublicVenueEventByKey(venue, eventKey);

  if (!venueRecord || !event) {
    notFound();
  }

  const paymentCapability = await getVenuePaymentCapability(venueRecord.id);
  const paidEventUnavailable = event.price_cents !== null && !paymentCapability.canSellPaidEvents;
  const rsvpAction = createFreeEventBookingAction.bind(null, venue, eventKey);
  const paidAction = createPaidEventCheckoutAction.bind(null, venue, eventKey);
  const isFree = event.price_cents === null || event.price_cents === 0;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-12">
      <section className="rounded-[2rem] border border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,242,234,0.92))] px-6 py-7 shadow-[0_24px_70px_rgba(80,54,31,0.08)] md:px-8">
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <Badge variant="accent">Event</Badge>
          {isFree ? (
            <Badge variant="success">Free RSVP</Badge>
          ) : (
            <Badge variant="info">{formatCurrency(event.price_cents!, event.currency)}</Badge>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h1 className="font-display text-4xl tracking-tight text-foreground md:text-5xl">{event.title}</h1>
            {event.description && (
              <p className="mt-4 max-w-2xl text-base leading-8 text-muted-foreground">{event.description}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {[
              { label: "Date & time", value: formatDate(event.starts_at) },
              { label: "Capacity", value: String(event.capacity ?? "Open") },
              { label: "Price", value: isFree ? "Free" : formatCurrency(event.price_cents!, event.currency) },
            ].map((item) => (
              <div
                className="rounded-3xl border border-border/70 bg-white/70 px-4 py-4"
                key={item.label}
              >
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {item.label}
                </div>
                <div className="mt-2 text-sm font-semibold leading-6 text-foreground">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-6 space-y-4">
        {checkout === "success" && <Alert variant="success">Checkout completed. Your confirmation will appear shortly.</Alert>}
        {checkout === "cancel" && <Alert variant="warning">Checkout was canceled before payment completed.</Alert>}
        {message && <Alert variant="success">{message}</Alert>}
        {error && <Alert variant="error">{error}</Alert>}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        {paidEventUnavailable ? (
          <Card className="border-border/80 bg-white/88 shadow-[0_18px_48px_rgba(80,54,31,0.06)]">
            <div className="text-lg font-semibold text-foreground">Paid ticketing is unavailable right now.</div>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {getPaidEventGateCopy()} This venue can still use TaproomOS for menus, free events, displays, follows,
              and Square-linked catalog management.
            </p>
          </Card>
        ) : (
          <Card className="border-border/80 bg-white/88 shadow-[0_18px_48px_rgba(80,54,31,0.06)]">
            <div className="mb-5 text-lg font-semibold text-foreground">
              {isFree ? "RSVP for this event" : "Reserve your spot"}
            </div>
            <form action={isFree ? rsvpAction : paidAction} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="booking-name">
                  Your name <span className="text-primary">*</span>
                </Label>
                <Input id="booking-name" name="purchaser_name" placeholder="Sam Taproom" required />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="booking-email">Email</Label>
                  <Input id="booking-email" name="purchaser_email" placeholder="sam@example.com" type="email" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="booking-phone">Phone</Label>
                  <Input id="booking-phone" name="purchaser_phone" placeholder="+1 555 123 4567" />
                </div>
              </div>

              <div className="max-w-[9rem] space-y-1.5">
                <Label htmlFor="booking-party-size">Party size</Label>
                <Input defaultValue="1" id="booking-party-size" min="1" name="party_size" type="number" />
              </div>

              <Button className="w-full md:w-auto" type="submit">
                {isFree ? "Confirm RSVP" : "Continue to checkout"}
              </Button>
            </form>
          </Card>
        )}

        <PublicFollowCard returnPath={`/v/${venue}/events/${event.id}`} venueSlug={venue} title="Get future event drops" />
      </div>

      <PublicPageAttribution />
    </main>
  );
}

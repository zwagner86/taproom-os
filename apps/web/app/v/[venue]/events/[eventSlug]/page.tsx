export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";

import { Badge, Button, Card, Input, Label } from "@taproom/ui";

import { PublicFollowCard } from "@/components/public-follow-card";
import { createFreeEventBookingAction, createPaidEventCheckoutAction } from "@/server/actions/events";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getPublicVenueEventBySlug } from "@/server/repositories/events";

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

  const rsvpAction = createFreeEventBookingAction.bind(null, venue, eventSlug);
  const paidAction = createPaidEventCheckoutAction.bind(null, venue, eventSlug);

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-12 lg:px-8">
      <Card className="space-y-5">
        <Badge>Event detail</Badge>
        <h1 className="font-display text-5xl text-ink">{event.title}</h1>
        <p className="text-base text-ink/60">{formatDate(event.starts_at)}</p>
        <p className="text-base leading-8 text-ink/70">{event.description ?? "Join us in the taproom."}</p>
        {event.price_cents !== null ? (
          <p className="text-sm font-semibold text-ink/65">{formatCurrency(event.price_cents, event.currency)}</p>
        ) : (
          <p className="text-sm font-semibold text-ink/55">Free RSVP</p>
        )}
        {checkout === "success" ? (
          <p className="rounded-3xl bg-pine/10 px-4 py-3 text-sm text-pine">Checkout completed. Your confirmation will appear shortly.</p>
        ) : null}
        {checkout === "cancel" ? (
          <p className="rounded-3xl bg-ember/10 px-4 py-3 text-sm text-ember">Checkout was canceled before payment completed.</p>
        ) : null}
        {message ? <p className="rounded-3xl bg-pine/10 px-4 py-3 text-sm text-pine">{message}</p> : null}
        {error ? <p className="rounded-3xl bg-ember/10 px-4 py-3 text-sm text-ember">{error}</p> : null}
      </Card>

      <Card>
        <form action={event.price_cents === null ? rsvpAction : paidAction} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="booking-name">Your name</Label>
            <Input id="booking-name" name="purchaser_name" placeholder="Sam Taproom" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="booking-email">Email</Label>
            <Input id="booking-email" name="purchaser_email" placeholder="sam@example.com" type="email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="booking-phone">Phone</Label>
            <Input id="booking-phone" name="purchaser_phone" placeholder="+1 555 123 4567" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="booking-party-size">Party size</Label>
            <Input defaultValue="1" id="booking-party-size" min="1" name="party_size" type="number" />
          </div>
          <div className="flex items-end">
            <Button type="submit">{event.price_cents === null ? "Confirm RSVP" : "Continue to checkout"}</Button>
          </div>
        </form>
      </Card>

      <PublicFollowCard returnPath={`/v/${venue}/events/${eventSlug}`} venueSlug={venue} />
    </main>
  );
}

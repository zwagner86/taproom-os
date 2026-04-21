export const dynamic = "force-dynamic";

import type { Route } from "next";
import Link from "next/link";

import { Calendar } from "lucide-react";

import { Alert, Badge, Button, Card, EmptyState, Input, Label, PageHeader, Select, Textarea } from "@taproom/ui";

import { DateTimeField } from "@/components/date-time-field";
import { EventEditPanel } from "@/components/event-edit-panel";
import { getPaidEventGateCopy } from "@/lib/venue-payment-capability";
import { createEventAction, updateEventAction } from "@/server/actions/events";
import { formatCurrency, formatDate } from "@/lib/utils";
import { listEventBookings, listVenueEvents } from "@/server/repositories/events";
import { requireVenueAccess } from "@/server/repositories/venues";
import { getVenuePaymentCapability } from "@/server/services/payment-capability";

export default async function VenueEventsPage({
  params,
  searchParams,
}: {
  params: Promise<{ venue: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { venue } = await params;
  const [{ venue: venueRecord }, { error, message }] = await Promise.all([
    requireVenueAccess(venue),
    searchParams,
  ]);
  const capability = await getVenuePaymentCapability(venueRecord.id);
  const events = await listVenueEvents(venueRecord.id);
  const bookingsByEvent = await Promise.all(
    events.map(async (event) => ({
      bookings: await listEventBookings(venueRecord.id, event.id),
      eventId: event.id,
    })),
  );
  const bookingsLookup = new Map(bookingsByEvent.map((entry) => [entry.eventId, entry.bookings]));
  const createAction = createEventAction.bind(null, venue);
  const updateAction = updateEventAction.bind(null, venue);
  const publishedCount = events.filter((e) => e.status === "published").length;

  return (
    <div>
      <PageHeader title="Event Management" subtitle={`${events.length} events · ${publishedCount} published`} />

      {!capability.canSellPaidEvents && (
        <Alert variant="warning" className="mb-5">
          <strong>Stripe not connected.</strong> Paid events and memberships are unavailable. Free RSVPs still work.{" "}
          <Link className="font-semibold underline" href={`/app/${venue}/billing` as Route}>
            Set up billing →
          </Link>
        </Alert>
      )}

      {message && <Alert variant="success" className="mb-5">{message}</Alert>}
      {error && <Alert variant="error" className="mb-5">{error}</Alert>}

      {/* Events list */}
      {events.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-9 h-9 text-muted" />}
          title="No events yet"
          description="Create your first RSVP or paid event below."
          className="mb-5"
        />
      ) : (
        <div className="flex flex-col gap-3 mb-5">
          {events.map((event) => {
            const bookings = bookingsLookup.get(event.id) ?? [];
            const confirmedSeats = bookings
              .filter((b) => b.booking_status === "confirmed")
              .reduce((t, b) => t + b.party_size, 0);
            const dateParts = formatDate(event.starts_at).split(" ");

            return (
              <Card
                key={event.id}
                style={{ display: "flex", gap: 16, alignItems: "flex-start", position: "relative" }}
              >
                {/* Date chip */}
                <div
                  className="flex-shrink-0 text-center rounded-[10px] px-3 py-2.5"
                  style={{ minWidth: 56, background: "var(--accent-light)" }}
                >
                  <div
                    className="text-[10px] font-bold uppercase tracking-[0.8px]"
                    style={{ color: "var(--accent-dark)" }}
                  >
                    {dateParts[0]}
                  </div>
                  <div
                    className="text-[22px] font-black leading-tight"
                    style={{ color: "var(--accent-dark)" }}
                  >
                    {dateParts[1]?.replace(",", "")}
                  </div>
                </div>

                <div className="flex-1 min-w-0 py-0.5">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="font-bold text-[15px]" style={{ color: "var(--c-text)" }}>{event.title}</span>
                    <Badge variant={
                      event.status === "published" ? "success" :
                      event.status === "cancelled" ? "error" :
                      event.status === "archived" ? "default" : "warning"
                    }>
                      {event.status}
                    </Badge>
                    {event.price_cents === null || event.price_cents === 0 ? (
                      <Badge variant="info">Free</Badge>
                    ) : (
                      <Badge variant="accent">{formatCurrency(event.price_cents, event.currency)}</Badge>
                    )}
                  </div>

                  <div className="text-[13px] mb-2" style={{ color: "var(--c-muted)" }}>
                    {formatDate(event.starts_at)}{event.capacity != null ? ` · Cap: ${event.capacity}` : ""}
                  </div>

                  {event.description && (
                    <div className="text-[13px] leading-relaxed mb-2" style={{ color: "var(--c-muted)" }}>
                      {event.description}
                    </div>
                  )}

                  <div className="flex gap-4 text-[12.5px]" style={{ color: "var(--c-muted)" }}>
                    <span>🎟 {confirmedSeats} booked</span>
                    <Link
                      className="font-semibold"
                      href={`/app/${venue}/events/${event.id}/check-in` as Route}
                      style={{ color: "var(--accent)" }}
                    >
                      Check-in →
                    </Link>
                    <Link
                      className="font-semibold"
                      href={`/v/${venue}/events/${event.slug}` as Route}
                      style={{ color: "var(--accent)" }}
                    >
                      Public page →
                    </Link>
                  </div>
                </div>

                <EventEditPanel
                  action={updateAction}
                  canSellPaidEvents={capability.canSellPaidEvents}
                  event={event}
                  paidEventGateCopy={getPaidEventGateCopy()}
                />
              </Card>
            );
          })}
        </div>
      )}

      {/* Create event form */}
      <Card>
        <div className="text-sm font-semibold mb-4" style={{ color: "var(--c-text)" }}>New event</div>
        <form action={createAction} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="create-title">Title <span style={{ color: "var(--accent)" }}>*</span></Label>
            <Input id="create-title" name="title" placeholder="Trivia Night" required />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="create-capacity">Capacity</Label>
              <Input id="create-capacity" name="capacity" placeholder="80" type="number" />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="create-price">Price (cents)</Label>
              <Input id="create-price" name="price_cents" placeholder="1500" type="number" />
              <span className="text-xs" style={{ color: "var(--c-muted)" }}>Leave empty for free</span>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="create-status">Status</Label>
              <Select defaultValue="draft" id="create-status" name="status">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <DateTimeField label="Starts at" name="starts_at" required />
            <DateTimeField label="Ends at" name="ends_at" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="create-desc">Description</Label>
            <Textarea id="create-desc" name="description" placeholder="Short event copy for the public page" rows={2} />
          </div>
          <div className="flex gap-2">
            <Button type="submit">Create event</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

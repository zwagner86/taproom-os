export const dynamic = "force-dynamic";

import type { Route } from "next";
import Link from "next/link";

import { Badge, Button, Card, Input, Label, Select, Textarea } from "@taproom/ui";

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
      {/* Page header */}
      <div className="flex items-start justify-between mb-7 gap-4">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.5px] mb-1" style={{ color: "var(--c-text)" }}>
            Event Management
          </h1>
          <p className="text-[13.5px]" style={{ color: "var(--c-muted)" }}>
            {events.length} events · {publishedCount} published
          </p>
        </div>
      </div>

      {!capability.canSellPaidEvents && (
        <div className="mb-5 rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
          <strong>Stripe not connected.</strong> Paid events and memberships are unavailable. Free RSVPs still work.{" "}
          <Link className="font-semibold underline" href={`/app/${venue}/billing` as Route}>
            Set up billing →
          </Link>
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

      {/* Events list */}
      {events.length === 0 ? (
        <Card style={{ marginBottom: 20 }}>
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div style={{ fontSize: 36 }}>🎟</div>
            <div className="font-semibold text-[15px]" style={{ color: "var(--c-text)" }}>No events yet</div>
            <div className="text-[13.5px] max-w-xs leading-relaxed" style={{ color: "var(--c-muted)" }}>
              Create your first RSVP or paid event below.
            </div>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-3 mb-5">
          {events.map((event) => {
            const bookings = bookingsLookup.get(event.id) ?? [];
            const confirmedSeats = bookings
              .filter((b) => b.booking_status === "confirmed")
              .reduce((t, b) => t + b.party_size, 0);
            const dateParts = formatDate(event.starts_at).split(" ");

            return (
              <Card key={event.id} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                {/* Date chip */}
                <div
                  className="flex-shrink-0 text-center rounded-[10px] py-2.5"
                  style={{ width: 56, background: "var(--accent-light)" }}
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

                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-bold text-[15px]">{event.title}</span>
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
                  <div className="text-[13px] mb-1.5" style={{ color: "var(--c-muted)" }}>
                    {formatDate(event.starts_at)} · Cap: {event.capacity ?? "Open"}
                  </div>
                  {event.description && (
                    <div className="text-[13px] leading-relaxed mb-2">{event.description}</div>
                  )}
                  <div className="flex gap-3 text-[12.5px]" style={{ color: "var(--c-muted)" }}>
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

                {/* Inline edit */}
                <details className="flex-shrink-0">
                  <summary className="cursor-pointer">
                    <Button size="sm" type="button" variant="secondary">Edit</Button>
                  </summary>
                  <div
                    className="absolute z-10 mt-2 right-0 rounded-xl border border-rim bg-white shadow-modal p-4 w-[480px]"
                    style={{ position: "relative" }}
                  >
                    <form action={updateAction} className="flex flex-col gap-3">
                      <input name="event_id" type="hidden" value={event.id} />
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1 col-span-2">
                          <Label htmlFor={`title-${event.id}`}>Title</Label>
                          <Input defaultValue={event.title} id={`title-${event.id}`} name="title" required />
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label htmlFor={`status-${event.id}`}>Status</Label>
                          <Select defaultValue={event.status} id={`status-${event.id}`} name="status">
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                            <option value="archived">Archived</option>
                            <option value="cancelled">Cancelled</option>
                          </Select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label htmlFor={`capacity-${event.id}`}>Capacity</Label>
                          <Input defaultValue={event.capacity ?? ""} id={`capacity-${event.id}`} name="capacity" type="number" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label htmlFor={`price-${event.id}`}>Price (cents)</Label>
                          <Input defaultValue={event.price_cents ?? ""} id={`price-${event.id}`} name="price_cents" type="number" />
                          {!capability.canSellPaidEvents && (
                            <span className="text-xs text-amber-600">{getPaidEventGateCopy()}</span>
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label htmlFor={`starts-${event.id}`}>Starts at</Label>
                          <Input
                            defaultValue={toDateTimeLocal(event.starts_at)}
                            id={`starts-${event.id}`}
                            name="starts_at"
                            required
                            type="datetime-local"
                          />
                        </div>
                        <div className="flex flex-col gap-1 col-span-2">
                          <Label htmlFor={`desc-${event.id}`}>Description</Label>
                          <Textarea defaultValue={event.description ?? ""} id={`desc-${event.id}`} name="description" rows={2} />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" type="submit">Save changes</Button>
                      </div>
                    </form>
                  </div>
                </details>
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
            <div className="flex flex-col gap-1">
              <Label htmlFor="create-starts">Starts at <span style={{ color: "var(--accent)" }}>*</span></Label>
              <Input id="create-starts" name="starts_at" required type="datetime-local" />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="create-ends">Ends at</Label>
              <Input id="create-ends" name="ends_at" type="datetime-local" />
            </div>
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

function toDateTimeLocal(value: string) {
  return new Date(value).toISOString().slice(0, 16);
}

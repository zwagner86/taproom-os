export const dynamic = "force-dynamic";

import type { Route } from "next";
import Link from "next/link";

import { Button, Card, Input, Label, Select, Textarea } from "@taproom/ui";

import { createEventAction, refundEventBookingAction, updateEventAction } from "@/server/actions/events";
import { formatCurrency, formatDate } from "@/lib/utils";
import { listEventBookings, listVenueEvents } from "@/server/repositories/events";
import { requireVenueAccess } from "@/server/repositories/venues";

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

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Events</p>
          <h1 className="font-display text-4xl text-ink">Event operations</h1>
          <p className="max-w-3xl text-sm leading-6 text-ink/65">
            Create casual taproom events, publish public pages, capture RSVP or paid bookings, and jump directly into
            guest-list check-in.
          </p>
        </div>
        {message ? <p className="rounded-3xl bg-pine/10 px-4 py-3 text-sm text-pine">{message}</p> : null}
        {error ? <p className="rounded-3xl bg-ember/10 px-4 py-3 text-sm text-ember">{error}</p> : null}
      </Card>

      <Card>
        <form action={createAction} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="create-event-title">Title</Label>
            <Input id="create-event-title" name="title" placeholder="Trivia Night" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-event-slug">Slug</Label>
            <Input id="create-event-slug" name="slug" placeholder="trivia-night" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-event-status">Status</Label>
            <Select defaultValue="draft" id="create-event-status" name="status">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-event-starts-at">Starts at</Label>
            <Input id="create-event-starts-at" name="starts_at" required type="datetime-local" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-event-ends-at">Ends at</Label>
            <Input id="create-event-ends-at" name="ends_at" type="datetime-local" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-event-capacity">Capacity</Label>
            <Input id="create-event-capacity" name="capacity" placeholder="80" type="number" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-event-price">Price cents</Label>
            <Input id="create-event-price" name="price_cents" placeholder="1500" type="number" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-event-currency">Currency</Label>
            <Input defaultValue="USD" id="create-event-currency" name="currency" maxLength={3} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-event-image">Image URL</Label>
            <Input id="create-event-image" name="image_url" type="url" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="create-event-description">Description</Label>
            <Textarea id="create-event-description" name="description" placeholder="Short event copy for the public page" />
          </div>
          <div className="md:col-span-2">
            <Button type="submit">Create event</Button>
          </div>
        </form>
      </Card>

      <section className="grid gap-4">
        {events.map((event) => {
          const bookings = bookingsLookup.get(event.id) ?? [];
          const confirmedSeats = bookings
            .filter((booking) => booking.booking_status === "confirmed")
            .reduce((total, booking) => total + booking.party_size, 0);

          return (
            <Card className="space-y-5" key={event.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">{event.status}</p>
                  <h2 className="font-display text-3xl text-ink">{event.title}</h2>
                  <p className="text-sm text-ink/55">{formatDate(event.starts_at)}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-ink/10 bg-white px-5 text-sm font-semibold text-ink transition hover:border-ink/20"
                    href={`/v/${venue}/events/${event.slug}` as Route}
                  >
                    View public page
                  </Link>
                  <Link
                    className="inline-flex min-h-11 items-center justify-center rounded-full bg-pine px-5 text-sm font-semibold text-parchment shadow-panel transition hover:bg-pine/90"
                    href={`/app/${venue}/events/${event.id}/check-in` as Route}
                  >
                    Open check-in
                  </Link>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-3xl bg-mist/45 p-4 text-sm text-ink/70">
                  <p className="font-semibold text-ink">Capacity</p>
                  <p>{event.capacity ?? "Open"} seats</p>
                </div>
                <div className="rounded-3xl bg-mist/45 p-4 text-sm text-ink/70">
                  <p className="font-semibold text-ink">Reserved</p>
                  <p>{confirmedSeats} seats confirmed</p>
                </div>
                <div className="rounded-3xl bg-mist/45 p-4 text-sm text-ink/70">
                  <p className="font-semibold text-ink">Pricing</p>
                  <p>{event.price_cents === null ? "Free RSVP" : formatCurrency(event.price_cents, event.currency)}</p>
                </div>
              </div>

              <form action={updateAction} className="grid gap-4 md:grid-cols-2">
                <input name="event_id" type="hidden" value={event.id} />
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor={`event-title-${event.id}`}>Title</Label>
                  <Input defaultValue={event.title} id={`event-title-${event.id}`} name="title" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`event-slug-${event.id}`}>Slug</Label>
                  <Input defaultValue={event.slug} id={`event-slug-${event.id}`} name="slug" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`event-status-${event.id}`}>Status</Label>
                  <Select defaultValue={event.status} id={`event-status-${event.id}`} name="status">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                    <option value="cancelled">Cancelled</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`event-starts-at-${event.id}`}>Starts at</Label>
                  <Input
                    defaultValue={toDateTimeLocal(event.starts_at)}
                    id={`event-starts-at-${event.id}`}
                    name="starts_at"
                    required
                    type="datetime-local"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`event-ends-at-${event.id}`}>Ends at</Label>
                  <Input
                    defaultValue={event.ends_at ? toDateTimeLocal(event.ends_at) : ""}
                    id={`event-ends-at-${event.id}`}
                    name="ends_at"
                    type="datetime-local"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`event-capacity-${event.id}`}>Capacity</Label>
                  <Input defaultValue={event.capacity ?? ""} id={`event-capacity-${event.id}`} name="capacity" type="number" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`event-price-${event.id}`}>Price cents</Label>
                  <Input defaultValue={event.price_cents ?? ""} id={`event-price-${event.id}`} name="price_cents" type="number" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`event-currency-${event.id}`}>Currency</Label>
                  <Input defaultValue={event.currency} id={`event-currency-${event.id}`} name="currency" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`event-image-${event.id}`}>Image URL</Label>
                  <Input defaultValue={event.image_url ?? ""} id={`event-image-${event.id}`} name="image_url" type="url" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor={`event-description-${event.id}`}>Description</Label>
                  <Textarea defaultValue={event.description ?? ""} id={`event-description-${event.id}`} name="description" />
                </div>
                <div className="md:col-span-2">
                  <Button type="submit">Save event</Button>
                </div>
              </form>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-display text-xl text-ink">Bookings</h3>
                  <p className="text-sm text-ink/55">{bookings.length} total</p>
                </div>

                {bookings.length === 0 ? (
                  <p className="text-sm leading-6 text-ink/65">No bookings yet for this event.</p>
                ) : (
                  <div className="grid gap-3">
                    {bookings.map((booking) => {
                      const refundAction = refundEventBookingAction.bind(null, venue, booking.id);

                      return (
                        <div className="rounded-3xl border border-ink/10 bg-mist/35 p-4" key={booking.id}>
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold text-ink">{booking.purchaser_name}</p>
                              <p className="text-sm text-ink/60">
                                Party of {booking.party_size} · {booking.booking_status} · {booking.payment_status}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {booking.total_price_cents > 0 ? (
                                <p className="text-sm font-semibold text-ink/65">
                                  {formatCurrency(booking.total_price_cents, booking.currency)}
                                </p>
                              ) : null}
                              {booking.payment_status === "paid" && booking.stripe_charge_id ? (
                                <form action={refundAction}>
                                  <Button type="submit" variant="ghost">
                                    Full refund
                                  </Button>
                                </form>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>
          );
        })}

        {events.length === 0 ? (
          <Card>
            <p className="text-sm leading-6 text-ink/65">No events yet. Create your first RSVP or paid event above.</p>
          </Card>
        ) : null}
      </section>
    </div>
  );
}

function toDateTimeLocal(value: string) {
  return new Date(value).toISOString().slice(0, 16);
}

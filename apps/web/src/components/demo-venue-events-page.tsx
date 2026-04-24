"use client";

import { useEffect, useMemo, useState } from "react";

import type { Route } from "next";
import Link from "next/link";

import { Calendar } from "lucide-react";

import { DemoMutationAlert } from "@/components/demo-mutation-alert";
import { useDemoVenue } from "@/components/demo-venue-provider";
import { EventEditPanel } from "@/components/event-edit-panel";
import { Alert, Badge, Button, Card, EmptyState, FieldHint, FieldLabel, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { DateTimeField } from "@/components/date-time-field";
import { getPaidEventGateCopy } from "@/lib/venue-payment-capability";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { DemoEventBookingRecord, DemoEventRecord } from "@/lib/demo-venue-state";
import type { VenuePaymentCapability } from "@taproom/domain";

export function DemoVenueEventsPage({
  capability,
  initialError,
  initialEvents,
  initialVenueSlug,
}: {
  capability: VenuePaymentCapability;
  initialError?: string;
  initialEvents: Array<{
    bookings: DemoEventBookingRecord[];
    event: DemoEventRecord;
  }>;
  initialVenueSlug: string;
}) {
  const { createEvent, dispatchSeedEvents, state, updateEvent } = useDemoVenue();
  const events = state.events ?? initialEvents.map((entry) => entry.event);
  const bookingsLookup = useMemo(
    () =>
      new Map(
        initialEvents.map((entry) => [
          entry.event.id,
          entry.bookings,
        ]),
      ),
    [initialEvents],
  );
  const publishedCount = useMemo(() => events.filter((event) => event.status === "published").length, [events]);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [result, setResult] = useState<ReturnType<typeof createEvent> | null>(null);

  useEffect(() => {
    dispatchSeedEvents(initialEvents.map((entry) => entry.event));
  }, [dispatchSeedEvents, initialEvents]);

  const createAction = async (formData: FormData) => {
    try {
      setError(null);
      setResult(createEvent(formData, capability));
    } catch (nextError) {
      setResult(null);
      setError(nextError instanceof Error ? nextError.message : "Unable to create event.");
    }
  };

  return (
    <div>
      <PageHeader subtitle={`${events.length} events · ${publishedCount} published`} title="Event Management" />

      {!capability.canSellPaidEvents && (
        <Alert variant="warning" className="mb-5">
          <strong>Stripe not connected.</strong> Paid events and memberships are unavailable. Free RSVPs still work.{" "}
          <Link className="font-semibold underline" href={`/app/${initialVenueSlug}/billing` as Route}>
            Set up billing →
          </Link>
        </Alert>
      )}

      <div className="mb-5 space-y-4">
        <DemoMutationAlert onDismiss={() => setResult(null)} result={result} />
        {error && (
          <Alert onDismiss={() => setError(null)} variant="error">
            {error}
          </Alert>
        )}
      </div>

      {events.length === 0 ? (
        <EmptyState
          className="mb-5"
          description="Create your first RSVP or paid event below."
          icon={<Calendar className="w-9 h-9 text-muted" />}
          title="No events yet"
        />
      ) : (
        <div className="flex flex-col gap-3 mb-5">
          {events.map((event) => {
            const bookings = bookingsLookup.get(event.id) ?? [];
            const confirmedSeats = bookings
              .filter((booking) => booking.booking_status === "confirmed")
              .reduce((total, booking) => total + booking.party_size, 0);
            const dateParts = formatDate(event.starts_at).split(" ");

            return (
              <Card
                key={event.id}
                style={{ display: "flex", gap: 16, alignItems: "flex-start", position: "relative" }}
              >
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
                      href={`/app/${initialVenueSlug}/events/${event.id}/check-in` as Route}
                      style={{ color: "var(--accent)" }}
                    >
                      Check-in →
                    </Link>
                    <Link
                      className="font-semibold"
                      href={`/v/${initialVenueSlug}/events/${event.slug}` as Route}
                      style={{ color: "var(--accent)" }}
                    >
                      Public page →
                    </Link>
                  </div>
                </div>

                <EventEditPanel
                  action={async (formData) => {
                    try {
                      setError(null);
                      setResult(updateEvent(formData, capability));
                    } catch (nextError) {
                      setResult(null);
                      setError(nextError instanceof Error ? nextError.message : "Unable to update event.");
                    }
                  }}
                  canSellPaidEvents={capability.canSellPaidEvents}
                  event={event}
                  paidEventGateCopy={getPaidEventGateCopy()}
                />
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <div className="text-sm font-semibold mb-4" style={{ color: "var(--c-text)" }}>New event</div>
        <form action={createAction} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <FieldLabel htmlFor="create-title" required>Title</FieldLabel>
            <Input aria-describedby="create-title-hint" id="create-title" name="title" placeholder="Trivia Night" required />
            <FieldHint id="create-title-hint">
              This title appears on the public event page, check-in screen, and admin event list.
            </FieldHint>
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            <div className="flex flex-col gap-1">
              <FieldLabel
                htmlFor="create-capacity"
                info="Capacity limits how many total seats or spots can be booked for the event."
              >
                Capacity
              </FieldLabel>
              <Input aria-describedby="create-capacity-hint" id="create-capacity" name="capacity" placeholder="80" type="number" />
              <FieldHint id="create-capacity-hint">
                Leave this blank if the event does not have a booking cap.
              </FieldHint>
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel
                htmlFor="create-price"
                info="Prices are stored in cents, so enter 1500 for a $15.00 ticket."
              >
                Price (cents)
              </FieldLabel>
              <Input
                aria-describedby={`create-price-hint${!capability.canSellPaidEvents ? " create-price-gate" : ""}`}
                id="create-price"
                name="price_cents"
                placeholder="1500"
                type="number"
              />
              <FieldHint id="create-price-hint">Leave this blank or set it to `0` to make the event free.</FieldHint>
              {!capability.canSellPaidEvents && (
                <span className="text-xs text-amber-600" id="create-price-gate">{getPaidEventGateCopy()}</span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel
                htmlFor="create-status"
                info="Draft keeps the event hidden until you are ready. Published shows it on public event listings."
              >
                Status
              </FieldLabel>
              <Select aria-describedby="create-status-hint" defaultValue="draft" id="create-status" name="status">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </Select>
              <FieldHint id="create-status-hint">
                Start with Draft if you still need to confirm details before guests can see the event.
              </FieldHint>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <DateTimeField
              hint="Set the local start date and time that should appear on tickets, listings, and check-in tools."
              info="Use your venue's local time. This field is required for every event."
              label="Starts at"
              name="starts_at"
              required
            />
            <DateTimeField
              hint="Optional. Add an end time if you want guests and staff to see when the event wraps up."
              info="Leave this empty for open-ended events or when only the start time matters."
              label="Ends at"
              name="ends_at"
            />
          </div>
          <div className="flex flex-col gap-1">
            <FieldLabel htmlFor="create-desc">Description</FieldLabel>
            <Textarea
              aria-describedby="create-desc-hint"
              id="create-desc"
              name="description"
              placeholder="Short event copy for the public page"
              rows={2}
            />
            <FieldHint id="create-desc-hint">
              Optional copy shown on the public event page and on displays when descriptions are enabled.
            </FieldHint>
          </div>
          <div className="flex gap-2">
            <Button type="submit">Create event</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

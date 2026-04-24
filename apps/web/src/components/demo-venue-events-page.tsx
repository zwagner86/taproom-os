"use client";

import { useEffect, useMemo, useState } from "react";

import type { Route } from "next";
import Link from "next/link";

import { Calendar } from "lucide-react";

import { AdminCreateDrawer } from "@/components/admin-create-drawer";
import { EventCreateForm } from "@/components/admin-create-forms";
import { DemoMutationAlert } from "@/components/demo-mutation-alert";
import { useDemoVenue } from "@/components/demo-venue-provider";
import { EventEditPanel } from "@/components/event-edit-panel";
import { Alert, Badge, Card, EmptyState, PageHeader } from "@/components/ui";
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

  const createAction = async (formData: FormData, onSuccess?: () => void) => {
    try {
      setError(null);
      setResult(createEvent(formData, capability));
      onSuccess?.();
    } catch (nextError) {
      setResult(null);
      setError(nextError instanceof Error ? nextError.message : "Unable to create event.");
    }
  };

  return (
    <div>
      <PageHeader
        actions={
          <AdminCreateDrawer
            description="Create a draft or published event for RSVPs, tickets, public pages, and displays."
            title="New event"
            triggerLabel="New event"
          >
            {({ close }) => (
              <EventCreateForm
                action={(formData) => createAction(formData, close)}
                canSellPaidEvents={capability.canSellPaidEvents}
              />
            )}
          </AdminCreateDrawer>
        }
        subtitle={`${events.length} events · ${publishedCount} published`}
        title="Event Management"
      />

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
          description="Create your first RSVP or paid event."
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
                  closeAfterAction
                  event={event}
                  paidEventGateCopy={getPaidEventGateCopy()}
                />
              </Card>
            );
          })}
        </div>
      )}

    </div>
  );
}

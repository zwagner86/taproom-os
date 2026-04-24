"use client";

import { sortBookingsForCheckIn } from "@taproom/domain";
import { useEffect, useMemo, useState } from "react";

import { AdminCreateDrawer } from "@/components/admin-create-drawer";
import { CheckInSessionCreateForm } from "@/components/admin-create-forms";
import { DemoMutationAlert } from "@/components/demo-mutation-alert";
import { useDemoVenue } from "@/components/demo-venue-provider";
import { Alert, Badge, Button, Card, PageHeader } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import type { DemoCheckInSessionRecord, DemoEventBookingRecord, DemoEventRecord } from "@/lib/demo-venue-state";

export function DemoVenueCheckInPage({
  appUrl,
  eventId,
  initialBookings,
  initialError,
  initialEvent,
  initialSession,
}: {
  appUrl: string;
  eventId: string;
  initialBookings: DemoEventBookingRecord[];
  initialError?: string;
  initialEvent: DemoEventRecord;
  initialSession: DemoCheckInSessionRecord | null;
}) {
  const { createCheckInSession, dispatchSeedEventAdmin, state, updateCheckIn } = useDemoVenue();
  const event = (state.events ?? []).find((entry) => entry.id === eventId) ?? initialEvent;
  const eventAdmin = state.eventAdmin[eventId] ?? { bookings: initialBookings, session: initialSession };
  const sortedBookings = useMemo(
    () =>
      sortBookingsForCheckIn(
        eventAdmin.bookings.map((booking) => ({
          ...booking,
          checkedInCount: booking.checked_in_count,
          partySize: booking.party_size,
          purchaserName: booking.purchaser_name,
        })),
      ),
    [eventAdmin.bookings],
  );
  const checkedInTotal = useMemo(
    () => eventAdmin.bookings.reduce((total, booking) => total + booking.checked_in_count, 0),
    [eventAdmin.bookings],
  );
  const totalBooked = useMemo(
    () => eventAdmin.bookings.reduce((total, booking) => total + booking.party_size, 0),
    [eventAdmin.bookings],
  );
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [result, setResult] = useState<ReturnType<typeof createCheckInSession> | null>(null);

  useEffect(() => {
    dispatchSeedEventAdmin(eventId, {
      bookings: initialBookings,
      session: initialSession,
    });
  }, [dispatchSeedEventAdmin, eventId, initialBookings, initialSession]);

  return (
    <div className="space-y-6">
      <PageHeader
        subtitle={`Check-in · ${formatDate(event.starts_at)} · ${checkedInTotal}/${totalBooked} checked in`}
        title={event.title}
      />

      <div className="space-y-4">
        <DemoMutationAlert onDismiss={() => setResult(null)} result={result} />
        {error && (
          <Alert onDismiss={() => setError(null)} variant="error">
            {error}
          </Alert>
        )}
      </div>

      <Card style={{ marginBottom: 20 }}>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>Shared door session</div>
          {!eventAdmin.session && (
            <AdminCreateDrawer
              description="Create one door-staff link for this event. PIN is optional."
              title="New shared session"
              triggerLabel="New session"
            >
              {({ close }) => (
                <CheckInSessionCreateForm
                  action={async (formData) => {
                    try {
                      setError(null);
                      setResult(createCheckInSession(eventId, formData));
                      close();
                    } catch (nextError) {
                      setResult(null);
                      setError(nextError instanceof Error ? nextError.message : "Unable to create the shared session.");
                    }
                  }}
                />
              )}
            </AdminCreateDrawer>
          )}
        </div>
        <p className="text-[13px] mb-4" style={{ color: "var(--c-muted)" }}>
          Create one session per event and share the link with door staff. PIN is optional.
        </p>
        {eventAdmin.session ? (
          <div className="grid gap-3 md:grid-cols-2">
            <div
              className="rounded-lg px-3 py-2.5"
              style={{ background: "var(--c-bg2)" }}
            >
              <div className="text-[11px] font-semibold uppercase tracking-[0.6px] mb-1" style={{ color: "var(--c-muted)" }}>Shared link</div>
              <div className="text-[13px] break-all" style={{ color: "var(--c-text)" }}>
                {`${appUrl}/check-in/${eventAdmin.session.token}`}
              </div>
            </div>
            <div
              className="rounded-lg px-3 py-2.5"
              style={{ background: "var(--c-bg2)" }}
            >
              <div className="text-[11px] font-semibold uppercase tracking-[0.6px] mb-1" style={{ color: "var(--c-muted)" }}>PIN</div>
              <div className="text-[13px]" style={{ color: "var(--c-text)" }}>
                {eventAdmin.session.pin ?? "No PIN required"}
              </div>
            </div>
          </div>
        ) : null}
      </Card>

      <div
        className="text-[13px] font-bold uppercase tracking-[0.8px] mb-3"
        style={{ color: "var(--c-muted)" }}
      >
        Guest list · {eventAdmin.bookings.length} bookings
      </div>
      {sortedBookings.length === 0 ? (
        <Card>
          <p className="text-[13.5px]" style={{ color: "var(--c-muted)" }}>No bookings yet for this event.</p>
        </Card>
      ) : (
        <Card style={{ padding: 0 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
            <thead>
              <tr style={{ borderBottom: "1.5px solid var(--c-border)" }}>
                {["Guest", "Party", "Checked in", "Actions"].map((header) => (
                  <th
                    key={header}
                    style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "var(--c-muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedBookings.map((booking, index) => {
                const remaining = booking.party_size - booking.checked_in_count;

                return (
                  <tr
                    key={booking.id}
                    style={{ borderBottom: index < sortedBookings.length - 1 ? "1px solid var(--c-border)" : "none" }}
                  >
                    <td style={{ padding: "11px 12px" }}>
                      <div className="font-semibold" style={{ color: "var(--c-text)" }}>{booking.purchaser_name}</div>
                    </td>
                    <td style={{ padding: "11px 12px", color: "var(--c-muted)", fontSize: 13 }}>
                      {booking.party_size}
                    </td>
                    <td style={{ padding: "11px 12px" }}>
                      <div className="flex items-center gap-2">
                        <Badge variant={booking.checked_in_count === booking.party_size ? "success" : booking.checked_in_count > 0 ? "warning" : "default"}>
                          {booking.checked_in_count} / {booking.party_size}
                        </Badge>
                      </div>
                    </td>
                    <td style={{ padding: "11px 12px" }}>
                      <div className="flex gap-1.5 flex-wrap">
                        {[
                          { delta: "1", disabled: remaining <= 0, label: "+1", variant: undefined },
                          { delta: "all", disabled: remaining <= 1, label: `+All (${remaining})`, variant: "secondary" as const },
                          { delta: "-1", disabled: booking.checked_in_count <= 0, label: "Undo", variant: "ghost" as const },
                        ].map((action) => (
                          <form
                            action={async (formData) => {
                              try {
                                setError(null);
                                setResult(updateCheckIn(eventId, formData));
                              } catch (nextError) {
                                setResult(null);
                                setError(nextError instanceof Error ? nextError.message : "Unable to update check-in.");
                              }
                            }}
                            key={`${booking.id}-${action.delta}`}
                          >
                            <input name="booking_id" type="hidden" value={booking.id} />
                            <input name="delta" type="hidden" value={action.delta} />
                            <Button
                              disabled={action.disabled}
                              size="sm"
                              type="submit"
                              variant={action.variant}
                              style={action.variant === "ghost" ? { color: "var(--c-muted)" } : undefined}
                            >
                              {action.label}
                            </Button>
                          </form>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

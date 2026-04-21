export const dynamic = "force-dynamic";

import { sortBookingsForCheckIn } from "@taproom/domain";
import { Badge, Button, Card, FieldHint, FieldLabel, Input } from "@taproom/ui";
import { notFound } from "next/navigation";

import { getEnv } from "@/env";
import { adjustCheckInAction, createCheckInSessionAction } from "@/server/actions/events";
import { getCheckInSessionForEvent, getVenueEventById, listEventBookings } from "@/server/repositories/events";
import { requireVenueAccess } from "@/server/repositories/venues";
import { formatDate } from "@/lib/utils";

export default async function VenueCheckInPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string; venue: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { eventId, venue } = await params;
  const [{ venue: venueRecord }, { error, message }] = await Promise.all([
    requireVenueAccess(venue),
    searchParams,
  ]);
  const [event, bookings, session] = await Promise.all([
    getVenueEventById(venueRecord.id, eventId),
    listEventBookings(venueRecord.id, eventId),
    getCheckInSessionForEvent(venueRecord.id, eventId),
  ]);

  if (!event) {
    notFound();
  }

  const createSessionAction = createCheckInSessionAction.bind(null, venue, event.id);
  const updateAction = adjustCheckInAction.bind(null, venue, event.id);
  const sortedBookings = sortBookingsForCheckIn(
    bookings.map((booking) => ({
      ...booking,
      checkedInCount: booking.checked_in_count,
      partySize: booking.party_size,
      purchaserName: booking.purchaser_name,
    })),
  );

  const checkedInTotal = bookings.reduce((t, b) => t + b.checked_in_count, 0);
  const totalBooked = bookings.reduce((t, b) => t + b.party_size, 0);

  return (
    <div>
      <div className="flex items-start justify-between mb-7 gap-4">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.5px] mb-1" style={{ color: "var(--c-text)" }}>
            {event.title}
          </h1>
          <p className="text-[13.5px]" style={{ color: "var(--c-muted)" }}>
            Check-in · {formatDate(event.starts_at)} · {checkedInTotal}/{totalBooked} checked in
          </p>
        </div>
      </div>

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

      {/* Shared session */}
      <Card style={{ marginBottom: 20 }}>
        <div className="text-sm font-semibold mb-3" style={{ color: "var(--c-text)" }}>Shared door session</div>
        <p className="text-[13px] mb-4" style={{ color: "var(--c-muted)" }}>
          Create one session per event and share the link with door staff. PIN is optional.
        </p>
        {session ? (
          <div className="grid grid-cols-2 gap-3">
            <div
              className="rounded-lg px-3 py-2.5"
              style={{ background: "var(--c-bg2)" }}
            >
              <div className="text-[11px] font-semibold uppercase tracking-[0.6px] mb-1" style={{ color: "var(--c-muted)" }}>Shared link</div>
              <div className="text-[13px] break-all" style={{ color: "var(--c-text)" }}>
                {`${getEnv().NEXT_PUBLIC_APP_URL}/check-in/${session.token}`}
              </div>
            </div>
            <div
              className="rounded-lg px-3 py-2.5"
              style={{ background: "var(--c-bg2)" }}
            >
              <div className="text-[11px] font-semibold uppercase tracking-[0.6px] mb-1" style={{ color: "var(--c-muted)" }}>PIN</div>
              <div className="text-[13px]" style={{ color: "var(--c-text)" }}>
                {session.pin ?? "No PIN required"}
              </div>
            </div>
          </div>
        ) : (
          <form action={createSessionAction} className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <FieldLabel htmlFor="session-name">Session name</FieldLabel>
              <Input
                aria-describedby="session-name-hint"
                defaultValue="Shared check-in"
                id="session-name"
                name="session_name"
              />
              <FieldHint id="session-name-hint">
                Give the shared session a clear name so staff know which link to use at the door.
              </FieldHint>
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel
                htmlFor="session-pin"
                info="Add a PIN if you want staff to enter a short code before they can use the shared check-in page."
              >
                PIN (optional)
              </FieldLabel>
              <Input aria-describedby="session-pin-hint" id="session-pin" name="pin" placeholder="Leave blank for no PIN" />
              <FieldHint id="session-pin-hint">
                Leave this blank for faster access, or set a short code if the shared link may circulate beyond your staff.
              </FieldHint>
            </div>
            <div className="col-span-2">
              <Button type="submit">Create shared session</Button>
            </div>
          </form>
        )}
      </Card>

      {/* Guest list */}
      <div
        className="text-[13px] font-bold uppercase tracking-[0.8px] mb-3"
        style={{ color: "var(--c-muted)" }}
      >
        Guest list · {bookings.length} bookings
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
                {["Guest", "Party", "Checked in", "Actions"].map((h) => (
                  <th
                    key={h}
                    style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "var(--c-muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedBookings.map((booking, i) => {
                const remaining = booking.party_size - booking.checked_in_count;
                return (
                  <tr
                    key={booking.id}
                    style={{ borderBottom: i < sortedBookings.length - 1 ? "1px solid var(--c-border)" : "none" }}
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
                        <form action={updateAction}>
                          <input name="booking_id" type="hidden" value={booking.id} />
                          <input name="delta" type="hidden" value="1" />
                          <Button disabled={remaining <= 0} size="sm" type="submit">+1</Button>
                        </form>
                        {remaining > 1 && (
                          <form action={updateAction}>
                            <input name="booking_id" type="hidden" value={booking.id} />
                            <input name="delta" type="hidden" value="all" />
                            <Button size="sm" type="submit" variant="secondary">+All ({remaining})</Button>
                          </form>
                        )}
                        {booking.checked_in_count > 0 && (
                          <form action={updateAction}>
                            <input name="booking_id" type="hidden" value={booking.id} />
                            <input name="delta" type="hidden" value="-1" />
                            <Button size="sm" type="submit" variant="ghost" style={{ color: "var(--c-muted)" }}>Undo</Button>
                          </form>
                        )}
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

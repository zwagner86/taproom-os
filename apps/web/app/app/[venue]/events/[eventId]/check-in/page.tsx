export const dynamic = "force-dynamic";

import { sortBookingsForCheckIn } from "@taproom/domain";
import { Button, Card, Input, Label } from "@taproom/ui";
import { notFound } from "next/navigation";

import { getEnv } from "@/env";
import { adjustCheckInAction, createCheckInSessionAction } from "@/server/actions/events";
import { getCheckInSessionForEvent, getVenueEventById, listEventBookings } from "@/server/repositories/events";
import { requireVenueAccess } from "@/server/repositories/venues";

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

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Check-in</p>
          <h1 className="font-display text-4xl text-ink">{event.title}</h1>
          <p className="text-sm leading-6 text-ink/65">
            Use a live guest list instead of scanning tickets. Partial attendance is supported for large parties.
          </p>
        </div>
        {message ? <p className="rounded-3xl bg-pine/10 px-4 py-3 text-sm text-pine">{message}</p> : null}
        {error ? <p className="rounded-3xl bg-ember/10 px-4 py-3 text-sm text-ember">{error}</p> : null}
      </Card>

      <Card className="space-y-4">
        <div className="space-y-2">
          <h2 className="font-display text-2xl text-ink">Shared session</h2>
          <p className="text-sm leading-6 text-ink/65">
            Create one session per event and hand the link to staff running the door. PIN is optional.
          </p>
        </div>

        {session ? (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-3xl bg-mist/40 p-4 text-sm text-ink/70">
              <p className="font-semibold text-ink">Shared link</p>
              <p className="break-all">{`${getEnv().NEXT_PUBLIC_APP_URL}/check-in/${session.token}`}</p>
            </div>
            <div className="rounded-3xl bg-mist/40 p-4 text-sm text-ink/70">
              <p className="font-semibold text-ink">PIN</p>
              <p>{session.pin ?? "No PIN required"}</p>
            </div>
          </div>
        ) : (
          <form action={createSessionAction} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="session-name">Session name</Label>
              <Input defaultValue="Shared check-in" id="session-name" name="session_name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="session-pin">PIN</Label>
              <Input id="session-pin" name="pin" placeholder="Optional" />
            </div>
            <div className="md:col-span-2">
              <Button type="submit">Create shared session</Button>
            </div>
          </form>
        )}
      </Card>

      <section className="grid gap-3">
        {sortedBookings.map((booking) => (
          <Card className="space-y-4" key={booking.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl text-ink">{booking.purchaser_name}</h2>
                <p className="text-sm text-ink/60">
                  Party of {booking.party_size} · Checked in {booking.checked_in_count}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <form action={updateAction}>
                <input name="booking_id" type="hidden" value={booking.id} />
                <input name="delta" type="hidden" value="1" />
                <Button type="submit">+1</Button>
              </form>
              <form action={updateAction}>
                <input name="booking_id" type="hidden" value={booking.id} />
                <input name="delta" type="hidden" value="all" />
                <Button type="submit" variant="secondary">
                  +All Remaining
                </Button>
              </form>
              <form action={updateAction}>
                <input name="booking_id" type="hidden" value={booking.id} />
                <input name="delta" type="hidden" value="-1" />
                <Button type="submit" variant="ghost">
                  Undo 1
                </Button>
              </form>
            </div>
          </Card>
        ))}

        {sortedBookings.length === 0 ? (
          <Card>
            <p className="text-sm leading-6 text-ink/65">No bookings yet for this event.</p>
          </Card>
        ) : null}
      </section>
    </div>
  );
}

export const dynamic = "force-dynamic";

import { sortBookingsForCheckIn } from "@taproom/domain";
import { Button, Card, Input, Label } from "@taproom/ui";
import { notFound } from "next/navigation";

import { adjustCheckInWithTokenAction } from "@/server/actions/events";
import {
  getCheckInSessionByTokenAdmin,
  getVenueEventByIdAdmin,
  listEventBookingsAdmin,
} from "@/server/repositories/events";

export default async function SharedCheckInPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string; message?: string; pin?: string }>;
}) {
  const { token } = await params;
  const { error, message, pin } = await searchParams;
  const session = await getCheckInSessionByTokenAdmin(token);

  if (!session) {
    notFound();
  }

  const [event, bookings] = await Promise.all([
    getVenueEventByIdAdmin(session.event_id),
    listEventBookingsAdmin(session.event_id),
  ]);

  if (!event) {
    notFound();
  }

  const isPinned = !session.pin || session.pin === pin;
  const action = adjustCheckInWithTokenAction.bind(null, token);
  const sortedBookings = sortBookingsForCheckIn(
    bookings.map((booking) => ({
      ...booking,
      checkedInCount: booking.checked_in_count,
      partySize: booking.party_size,
      purchaserName: booking.purchaser_name,
    })),
  );

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-10 lg:px-8">
      <Card className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Shared event check-in</p>
          <h1 className="font-display text-4xl text-ink">{event.title}</h1>
          <p className="text-sm leading-6 text-ink/65">Door staff can use this guest list without individual staff accounts in MVP.</p>
        </div>
        {message ? <p className="rounded-3xl bg-pine/10 px-4 py-3 text-sm text-pine">{message}</p> : null}
        {error ? <p className="rounded-3xl bg-ember/10 px-4 py-3 text-sm text-ember">{error}</p> : null}
      </Card>

      {!isPinned ? (
        <Card>
          <form className="grid gap-4 md:grid-cols-[1fr_auto]">
            <div className="space-y-2">
              <Label htmlFor="shared-pin">PIN</Label>
              <Input id="shared-pin" name="pin" placeholder="Enter session PIN" />
            </div>
            <div className="flex items-end">
              <Button type="submit">Unlock guest list</Button>
            </div>
          </form>
        </Card>
      ) : (
        <section className="grid gap-3">
          {sortedBookings.map((booking) => (
            <Card className="space-y-4" key={booking.id}>
              <div>
                <h2 className="font-display text-2xl text-ink">{booking.purchaser_name}</h2>
                <p className="text-sm text-ink/60">
                  Party of {booking.party_size} · Checked in {booking.checked_in_count}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <form action={action}>
                  <input name="booking_id" type="hidden" value={booking.id} />
                  <input name="delta" type="hidden" value="1" />
                  <input name="pin" type="hidden" value={pin ?? ""} />
                  <Button type="submit">+1</Button>
                </form>
                <form action={action}>
                  <input name="booking_id" type="hidden" value={booking.id} />
                  <input name="delta" type="hidden" value="all" />
                  <input name="pin" type="hidden" value={pin ?? ""} />
                  <Button type="submit" variant="secondary">
                    +All Remaining
                  </Button>
                </form>
                <form action={action}>
                  <input name="booking_id" type="hidden" value={booking.id} />
                  <input name="delta" type="hidden" value="-1" />
                  <input name="pin" type="hidden" value={pin ?? ""} />
                  <Button type="submit" variant="ghost">
                    Undo 1
                  </Button>
                </form>
              </div>
            </Card>
          ))}
        </section>
      )}
    </main>
  );
}

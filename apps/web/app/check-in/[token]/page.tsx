export const dynamic = "force-dynamic";

import { sortBookingsForCheckIn } from "@taproom/domain";
import { notFound } from "next/navigation";

import { Alert, Badge, Button, Card, Input, Label } from "@/components/ui";
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

  const checkedInTotal = bookings.reduce((t, b) => t + b.checked_in_count, 0);
  const totalBooked = bookings.reduce((t, b) => t + b.party_size, 0);

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 md:px-6 md:py-8">
      <section className="mb-6 rounded-[2rem] border border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,242,234,0.92))] px-6 py-6 shadow-[0_24px_70px_rgba(80,54,31,0.08)]">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Door check-in</div>
        <h1 className="mt-2 font-display text-4xl tracking-tight text-foreground">{event.title}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {checkedInTotal} of {totalBooked} checked in
        </p>
      </section>

      <div className="mb-6 space-y-4">
        {message && <Alert variant="success">{message}</Alert>}
        {error && <Alert variant="error">{error}</Alert>}
      </div>

      {!isPinned ? (
        <Card className="border-border/80 bg-white/88 shadow-[0_18px_48px_rgba(80,54,31,0.06)]">
          <div className="mb-4 text-lg font-semibold text-foreground">PIN required</div>
          <form className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="shared-pin">Session PIN</Label>
              <Input id="shared-pin" name="pin" placeholder="Enter session PIN" />
            </div>
            <div className="sm:self-end">
              <Button type="submit">Unlock</Button>
            </div>
          </form>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedBookings.length === 0 ? (
            <Card className="border-border/80 bg-white/88 shadow-[0_18px_48px_rgba(80,54,31,0.06)]">
              <p className="text-sm text-muted-foreground">No bookings yet for this event.</p>
            </Card>
          ) : (
            sortedBookings.map((booking) => {
              const remaining = booking.party_size - booking.checked_in_count;
              return (
                <Card
                  className="border-border/80 bg-white/88 shadow-[0_14px_40px_rgba(80,54,31,0.06)]"
                  key={booking.id}
                >
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-xl font-semibold tracking-[-0.02em] text-foreground">{booking.purchaser_name}</div>
                      <div className="mt-1 text-sm text-muted-foreground">Party of {booking.party_size}</div>
                    </div>
                    <Badge
                      variant={
                        booking.checked_in_count === booking.party_size
                          ? "success"
                          : booking.checked_in_count > 0
                            ? "warning"
                            : "default"
                      }
                    >
                      {booking.checked_in_count}/{booking.party_size} in
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <form action={action}>
                      <input name="booking_id" type="hidden" value={booking.id} />
                      <input name="delta" type="hidden" value="1" />
                      <input name="pin" type="hidden" value={pin ?? ""} />
                      <Button disabled={remaining <= 0} size="sm" type="submit">
                        +1
                      </Button>
                    </form>
                    {remaining > 1 && (
                      <form action={action}>
                        <input name="booking_id" type="hidden" value={booking.id} />
                        <input name="delta" type="hidden" value="all" />
                        <input name="pin" type="hidden" value={pin ?? ""} />
                        <Button size="sm" type="submit" variant="secondary">
                          +All ({remaining})
                        </Button>
                      </form>
                    )}
                    {booking.checked_in_count > 0 && (
                      <form action={action}>
                        <input name="booking_id" type="hidden" value={booking.id} />
                        <input name="delta" type="hidden" value="-1" />
                        <input name="pin" type="hidden" value={pin ?? ""} />
                        <Button size="sm" type="submit" variant="ghost">
                          Undo
                        </Button>
                      </form>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}
    </main>
  );
}

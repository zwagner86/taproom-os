export const dynamic = "force-dynamic";

import { sortBookingsForCheckIn } from "@taproom/domain";
import { Badge, Button, Card, Input, Label } from "@taproom/ui";
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

  const checkedInTotal = bookings.reduce((t, b) => t + b.checked_in_count, 0);
  const totalBooked = bookings.reduce((t, b) => t + b.party_size, 0);

  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      {/* Header */}
      <div className="mb-6">
        <div
          className="text-[11px] font-bold uppercase tracking-[0.8px] mb-1"
          style={{ color: "var(--accent)" }}
        >
          Door check-in
        </div>
        <h1 className="text-[28px] font-black tracking-[-0.5px] mb-1" style={{ color: "var(--c-text)", fontFamily: "Lora, serif" }}>
          {event.title}
        </h1>
        <p className="text-[13.5px]" style={{ color: "var(--c-muted)" }}>
          {checkedInTotal} of {totalBooked} checked in
        </p>
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

      {!isPinned ? (
        <Card>
          <div className="text-sm font-semibold mb-3" style={{ color: "var(--c-text)" }}>PIN required</div>
          <form className="flex gap-2">
            <Input id="shared-pin" name="pin" placeholder="Enter session PIN" style={{ flex: 1 }} />
            <Button type="submit">Unlock</Button>
          </form>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {sortedBookings.length === 0 ? (
            <Card>
              <p className="text-[13.5px]" style={{ color: "var(--c-muted)" }}>No bookings yet for this event.</p>
            </Card>
          ) : (
            sortedBookings.map((booking, i) => {
              const remaining = booking.party_size - booking.checked_in_count;
              return (
                <Card key={booking.id}>
                  <div className="flex items-start justify-between mb-3 gap-4">
                    <div>
                      <div className="font-bold text-[17px]" style={{ color: "var(--c-text)" }}>
                        {booking.purchaser_name}
                      </div>
                      <div className="text-[13px]" style={{ color: "var(--c-muted)" }}>
                        Party of {booking.party_size}
                      </div>
                    </div>
                    <Badge variant={booking.checked_in_count === booking.party_size ? "success" : booking.checked_in_count > 0 ? "warning" : "default"}>
                      {booking.checked_in_count}/{booking.party_size} in
                    </Badge>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <form action={action}>
                      <input name="booking_id" type="hidden" value={booking.id} />
                      <input name="delta" type="hidden" value="1" />
                      <input name="pin" type="hidden" value={pin ?? ""} />
                      <Button disabled={remaining <= 0} size="sm" type="submit">+1</Button>
                    </form>
                    {remaining > 1 && (
                      <form action={action}>
                        <input name="booking_id" type="hidden" value={booking.id} />
                        <input name="delta" type="hidden" value="all" />
                        <input name="pin" type="hidden" value={pin ?? ""} />
                        <Button size="sm" type="submit" variant="secondary">+All ({remaining})</Button>
                      </form>
                    )}
                    {booking.checked_in_count > 0 && (
                      <form action={action}>
                        <input name="booking_id" type="hidden" value={booking.id} />
                        <input name="delta" type="hidden" value="-1" />
                        <input name="pin" type="hidden" value={pin ?? ""} />
                        <Button size="sm" type="submit" variant="ghost" style={{ color: "var(--c-muted)" }}>Undo</Button>
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

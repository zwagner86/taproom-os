export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";

import { Card } from "@taproom/ui";

import { formatDate } from "@/lib/utils";
import { listPublicVenueEvents } from "@/server/repositories/events";

export default async function EmbedEventsPage({ params }: { params: Promise<{ venue: string }> }) {
  const { venue } = await params;
  const { events, venue: venueRecord } = await listPublicVenueEvents(venue);

  if (!venueRecord) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-parchment px-4 py-6">
      <div className="mx-auto max-w-4xl space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">{venueRecord.name}</p>
          <h1 className="font-display text-4xl text-ink">Events</h1>
        </div>
        <div className="grid gap-4">
          {events.map((event) => (
            <Card className="space-y-2" key={event.id}>
              <h2 className="font-display text-2xl text-ink">{event.title}</h2>
              <p className="text-sm text-ink/55">{formatDate(event.starts_at)}</p>
              <p className="text-sm leading-6 text-ink/65">{event.description ?? "Taproom event details."}</p>
            </Card>
          ))}
          {events.length === 0 ? (
            <Card>
              <p className="text-sm text-ink/65">No published events yet.</p>
            </Card>
          ) : null}
        </div>
      </div>
    </main>
  );
}

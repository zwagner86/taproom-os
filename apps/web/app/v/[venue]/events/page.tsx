export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge, Card } from "@taproom/ui";

import { PublicFollowCard } from "@/components/public-follow-card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { listPublicVenueEvents } from "@/server/repositories/events";

export default async function PublicEventsPage({
  params,
  searchParams,
}: {
  params: Promise<{ venue: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { venue } = await params;
  const { error, message } = await searchParams;
  const { events, venue: venueRecord } = await listPublicVenueEvents(venue);

  if (!venueRecord) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-12 lg:px-8">
      <section className="space-y-4">
        <Badge>Events</Badge>
        <h1 className="font-display text-5xl text-ink">{venueRecord.name} happenings</h1>
        <p className="max-w-2xl text-base leading-7 text-ink/65">
          Book free events in one step or jump into Stripe Checkout for paid ticketing. Everything here flows from the
          venue’s shared event model.
        </p>
      </section>
      {message ? <p className="rounded-3xl bg-pine/10 px-4 py-3 text-sm text-pine">{message}</p> : null}
      {error ? <p className="rounded-3xl bg-ember/10 px-4 py-3 text-sm text-ember">{error}</p> : null}

      <div className="grid gap-4">
        {events.map((event) => (
          <Card className="space-y-3" key={event.id}>
            <h2 className="font-display text-2xl text-ink">{event.title}</h2>
            <p className="text-sm text-ink/55">{formatDate(event.starts_at)}</p>
            <p className="text-sm leading-6 text-ink/70">{event.description ?? "Taproom event details."}</p>
            {event.price_cents !== null ? (
              <p className="text-sm font-semibold text-ink/65">{formatCurrency(event.price_cents, event.currency)}</p>
            ) : (
              <p className="text-sm font-semibold text-ink/55">Free RSVP</p>
            )}
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-ink/10 bg-white px-5 text-sm font-semibold text-ink transition hover:border-ink/20"
              href={`/v/${venue}/events/${event.slug}`}
            >
              View details
            </Link>
          </Card>
        ))}

        {events.length === 0 ? (
          <Card>
            <p className="text-sm leading-6 text-ink/65">No published events yet for this venue.</p>
          </Card>
        ) : null}
      </div>

      <PublicFollowCard returnPath={`/v/${venue}/events`} venueSlug={venue} />
    </main>
  );
}

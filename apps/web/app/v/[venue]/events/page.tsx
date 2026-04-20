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
    <main className="mx-auto max-w-3xl px-5 py-10">
      <div className="mb-8">
        <Badge variant="accent" style={{ marginBottom: 10 }}>Events</Badge>
        <h1 className="text-[36px] font-black tracking-[-0.8px] mb-2" style={{ color: "var(--c-text)", fontFamily: "Lora, serif" }}>
          {venueRecord.name} happenings
        </h1>
        <p className="text-[15px] leading-relaxed" style={{ color: "var(--c-muted)" }}>
          Book free events in one step or jump into paid ticketing.
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

      <div className="flex flex-col gap-4 mb-8">
        {events.length === 0 ? (
          <Card>
            <div className="py-8 text-center">
              <div className="text-[32px] mb-2">🎟</div>
              <p className="text-[14px]" style={{ color: "var(--c-muted)" }}>No published events yet.</p>
            </div>
          </Card>
        ) : (
          events.map((event) => {
            const dateParts = formatDate(event.starts_at).split(" ");
            return (
              <Card key={event.id} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                {/* Date chip */}
                <div
                  className="flex-shrink-0 text-center rounded-[10px] py-2.5"
                  style={{ width: 54, background: "var(--accent-light)" }}
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

                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[16px] mb-1" style={{ color: "var(--c-text)" }}>
                    {event.title}
                  </div>
                  <div className="text-[13px] mb-1.5" style={{ color: "var(--c-muted)" }}>
                    {formatDate(event.starts_at)}
                  </div>
                  {event.description && (
                    <div className="text-[13.5px] leading-relaxed mb-2.5" style={{ color: "var(--c-muted)" }}>
                      {event.description}
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    {event.price_cents !== null && event.price_cents > 0 ? (
                      <Badge variant="accent">{formatCurrency(event.price_cents, event.currency)}</Badge>
                    ) : (
                      <Badge variant="success">Free RSVP</Badge>
                    )}
                    <Link
                      className="text-[13px] font-semibold"
                      href={`/v/${venue}/events/${event.slug}`}
                      style={{ color: "var(--accent)" }}
                    >
                      Book now →
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      <PublicFollowCard returnPath={`/v/${venue}/events`} venueSlug={venue} />
    </main>
  );
}

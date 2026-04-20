export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@taproom/ui";

import { formatCurrency, formatDate } from "@/lib/utils";
import { listPublicVenueEvents } from "@/server/repositories/events";

export default async function EmbedEventsPage({ params }: { params: Promise<{ venue: string }> }) {
  const { venue } = await params;
  const { events, venue: venueRecord } = await listPublicVenueEvents(venue);

  if (!venueRecord) {
    notFound();
  }

  return (
    <main className="min-h-screen px-4 py-6" style={{ background: "var(--c-bg)" }}>
      <div className="mx-auto max-w-2xl">
        <div className="mb-5">
          <div
            className="text-[11px] font-bold uppercase tracking-[0.8px] mb-0.5"
            style={{ color: "var(--accent)" }}
          >
            {venueRecord.name}
          </div>
          <h1 className="text-[24px] font-black tracking-[-0.5px]" style={{ color: "var(--c-text)", fontFamily: "Lora, serif" }}>
            Events
          </h1>
        </div>
        {events.length === 0 ? (
          <div
            className="rounded-xl border px-5 py-10 text-center"
            style={{ borderColor: "var(--c-border)", background: "white" }}
          >
            <p className="text-[14px]" style={{ color: "var(--c-muted)" }}>No published events yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {events.map((event) => {
              const dateParts = formatDate(event.starts_at).split(" ");
              return (
                <div
                  key={event.id}
                  className="rounded-xl border p-4 flex items-start gap-3"
                  style={{ borderColor: "var(--c-border)", background: "white" }}
                >
                  <div
                    className="flex-shrink-0 text-center rounded-[8px] py-2"
                    style={{ width: 46, background: "var(--accent-light)" }}
                  >
                    <div className="text-[9px] font-bold uppercase" style={{ color: "var(--accent-dark)" }}>{dateParts[0]}</div>
                    <div className="text-[18px] font-black leading-tight" style={{ color: "var(--accent-dark)" }}>{dateParts[1]?.replace(",", "")}</div>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-[14px]" style={{ color: "var(--c-text)" }}>{event.title}</div>
                    <div className="text-[12px] mt-0.5 mb-1.5" style={{ color: "var(--c-muted)" }}>{formatDate(event.starts_at)}</div>
                    <div className="flex items-center gap-2">
                      {event.price_cents !== null && event.price_cents > 0 ? (
                        <Badge variant="accent">{formatCurrency(event.price_cents, event.currency)}</Badge>
                      ) : (
                        <Badge variant="success">Free</Badge>
                      )}
                      <Link
                        className="text-[12px] font-semibold"
                        href={`/v/${venue}/events/${event.slug}`}
                        style={{ color: "var(--accent)" }}
                      >
                        Book →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

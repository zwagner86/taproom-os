export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";

import { formatAbv } from "@taproom/domain";

import { listPublicVenueItems } from "@/server/repositories/items";

export default async function TvMenuPage({ params }: { params: Promise<{ venue: string }> }) {
  const { venue } = await params;
  const { items, venue: venueRecord } = await listPublicVenueItems(venue);

  if (!venueRecord) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-ink px-8 py-10 text-parchment">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-parchment/70">{venueRecord.name}</p>
            <h1 className="font-display text-7xl">{venueRecord.menu_label}</h1>
          </div>
          {venueRecord.tagline ? <p className="max-w-xl text-right text-xl text-parchment/70">{venueRecord.tagline}</p> : null}
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {items.map((item) => (
            <div className="rounded-[2rem] border border-parchment/10 bg-white/5 p-6" key={item.id}>
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-display text-4xl">{item.name}</h2>
                <p className="text-sm uppercase tracking-[0.2em] text-parchment/55">{item.type}</p>
              </div>
              <p className="mt-2 text-lg text-parchment/70">
                {[item.style_or_category, formatAbv(item.abv)].filter(Boolean).join(" · ")}
              </p>
              {item.description ? <p className="mt-4 text-lg leading-8 text-parchment/80">{item.description}</p> : null}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

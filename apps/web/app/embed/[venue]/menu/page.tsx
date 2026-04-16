export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";

import { PublicItemList } from "@/components/public-item-list";
import { listPublicVenueItems } from "@/server/repositories/items";

export default async function EmbedMenuPage({ params }: { params: Promise<{ venue: string }> }) {
  const { venue } = await params;
  const { items, venue: venueRecord } = await listPublicVenueItems(venue);

  if (!venueRecord) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-parchment px-4 py-6">
      <div className="mx-auto max-w-4xl space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">{venueRecord.name}</p>
          <h1 className="font-display text-4xl text-ink">{venueRecord.menu_label}</h1>
        </div>
        <PublicItemList items={items} />
      </div>
    </main>
  );
}


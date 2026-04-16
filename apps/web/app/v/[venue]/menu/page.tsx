export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";

import { Badge } from "@taproom/ui";

import { PublicFollowCard } from "@/components/public-follow-card";
import { PublicItemList } from "@/components/public-item-list";
import { listPublicVenueItems } from "@/server/repositories/items";

export default async function PublicMenuPage({
  params,
  searchParams,
}: {
  params: Promise<{ venue: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { venue } = await params;
  const { error, message } = await searchParams;
  const { items, venue: venueRecord } = await listPublicVenueItems(venue);

  if (!venueRecord) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-12 lg:px-8">
      <section className="space-y-4">
        <Badge>{venueRecord.venue_type}</Badge>
        <div className="space-y-3">
          <h1 className="font-display text-5xl text-ink">{venueRecord.menu_label}</h1>
          <p className="max-w-2xl text-base leading-7 text-ink/65">
            {venueRecord.tagline ?? `${venueRecord.name} keeps rotating offerings, events, and fan touchpoints in one place.`}
          </p>
        </div>
      </section>
      {message ? <p className="rounded-3xl bg-pine/10 px-4 py-3 text-sm text-pine">{message}</p> : null}
      {error ? <p className="rounded-3xl bg-ember/10 px-4 py-3 text-sm text-ember">{error}</p> : null}

      <PublicItemList items={items} />
      <PublicFollowCard returnPath={`/v/${venue}/menu`} venueSlug={venue} />
    </main>
  );
}

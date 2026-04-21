export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";

import { PublicFollowCard } from "@/components/public-follow-card";
import { PublicItemList } from "@/components/public-item-list";
import { listPublicVenueItems } from "@/server/repositories/items";

export default async function PublicFoodPage({
  params,
}: {
  params: Promise<{ venue: string }>;
}) {
  const { venue } = await params;
  const { items, venue: venueRecord } = await listPublicVenueItems(venue);

  if (!venueRecord) {
    notFound();
  }

  const food = items.filter((i) => i.type === "food");

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <div className="mb-8">
        <h1 className="text-[36px] font-black tracking-[-0.8px] mb-2" style={{ color: "var(--c-text)", fontFamily: "Lora, serif" }}>
          Food Menu
        </h1>
        {venueRecord.tagline && (
          <p className="text-[15px] leading-relaxed" style={{ color: "var(--c-muted)" }}>
            {venueRecord.tagline}
          </p>
        )}
      </div>

      <div
        className="rounded-xl border mb-8"
        style={{ borderColor: "var(--c-border)", background: "white" }}
      >
        <div className="px-5 py-1">
          <PublicItemList emptyMessage="No food items right now — check back soon." items={food} />
        </div>
      </div>

      <PublicFollowCard returnPath={`/v/${venue}/food`} venueSlug={venue} />
    </main>
  );
}

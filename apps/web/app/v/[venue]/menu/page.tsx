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
    <main className="mx-auto max-w-3xl px-5 py-10">
      <div className="mb-8">
        <Badge variant="info" style={{ marginBottom: 10 }}>{venueRecord.venue_type}</Badge>
        <h1 className="text-[36px] font-black tracking-[-0.8px] mb-2" style={{ color: "var(--c-text)", fontFamily: "Lora, serif" }}>
          {venueRecord.menu_label}
        </h1>
        <p className="text-[15px] leading-relaxed" style={{ color: "var(--c-muted)" }}>
          {venueRecord.tagline ?? `${venueRecord.name} — rotating offerings, events, and fan touchpoints.`}
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

      <div
        className="rounded-xl border mb-8"
        style={{ borderColor: "var(--c-border)", background: "white" }}
      >
        <div className="px-5 py-1">
          <PublicItemList items={items} />
        </div>
      </div>

      <PublicFollowCard returnPath={`/v/${venue}/menu`} venueSlug={venue} />
    </main>
  );
}

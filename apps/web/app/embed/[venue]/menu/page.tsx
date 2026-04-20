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
            {venueRecord.menu_label}
          </h1>
        </div>
        <div
          className="rounded-xl border"
          style={{ borderColor: "var(--c-border)", background: "white" }}
        >
          <div className="px-5 py-1">
            <PublicItemList items={items} />
          </div>
        </div>
      </div>
    </main>
  );
}

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

  const pours = items.filter((i) => i.type === "pour");
  const other = items.filter((i) => i.type !== "pour");

  return (
    <main
      className="min-h-screen px-10 py-8"
      style={{ background: "var(--c-sidebar)", color: "oklch(92% 0.01 75)" }}
    >
      <div className="mx-auto max-w-[1400px]">
        {/* Header */}
        <div className="flex items-end justify-between gap-6 mb-8">
          <div>
            <div className="text-[13px] font-bold uppercase tracking-[0.28em] mb-1" style={{ color: "oklch(60% 0.01 75)" }}>
              {venueRecord.name}
            </div>
            <h1 className="text-[56px] font-black tracking-[-1px] leading-none" style={{ fontFamily: "Lora, serif", color: "oklch(95% 0.012 75)" }}>
              {venueRecord.menu_label}
            </h1>
          </div>
          {venueRecord.tagline && (
            <p className="max-w-sm text-right text-[17px] leading-relaxed" style={{ color: "oklch(62% 0.01 75)" }}>
              {venueRecord.tagline}
            </p>
          )}
        </div>

        {/* On tap */}
        {pours.length > 0 && (
          <div className="mb-8">
            <div className="text-[11px] font-bold uppercase tracking-[0.8px] mb-4" style={{ color: "var(--accent)" }}>
              On Tap · {pours.length}
            </div>
            <div className="grid gap-3 xl:grid-cols-2">
              {pours.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl p-5"
                  style={{ background: "oklch(18% 0.018 55)", border: "1px solid oklch(28% 0.015 55)" }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-[26px] font-black leading-tight tracking-[-0.5px]" style={{ fontFamily: "Lora, serif" }}>
                        {item.name}
                      </h2>
                      <p className="text-[15px] mt-1" style={{ color: "oklch(65% 0.01 75)" }}>
                        {[item.style_or_category, formatAbv(item.abv)].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    {item.abv !== null && (
                      <div className="flex-shrink-0 text-right">
                        <div className="text-[28px] font-black" style={{ color: "var(--accent)" }}>
                          {item.abv}%
                        </div>
                        <div className="text-[11px] uppercase tracking-[0.5px]" style={{ color: "oklch(55% 0.01 75)" }}>
                          ABV
                        </div>
                      </div>
                    )}
                  </div>
                  {item.description && (
                    <p className="mt-3 text-[15px] leading-relaxed" style={{ color: "oklch(68% 0.01 75)" }}>
                      {item.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Other items */}
        {other.length > 0 && (
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.8px] mb-4" style={{ color: "oklch(55% 0.01 75)" }}>
              Also available
            </div>
            <div className="grid gap-2 xl:grid-cols-3">
              {other.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg px-4 py-3"
                  style={{ background: "oklch(16% 0.015 55)", border: "1px solid oklch(24% 0.012 55)" }}
                >
                  <div className="font-semibold text-[15px]">{item.name}</div>
                  <div className="text-[12.5px] mt-0.5" style={{ color: "oklch(58% 0.01 75)" }}>
                    {item.style_or_category ?? item.type}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

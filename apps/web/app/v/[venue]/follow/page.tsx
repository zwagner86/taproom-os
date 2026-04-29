export const dynamic = "force-dynamic";

import type { CSSProperties } from "react";

import { notFound } from "next/navigation";

import { PublicFollowCard } from "@/components/public-follow-card";
import { PublicPageAttribution } from "@/components/public-page-attribution";
import { getVenueBySlug } from "@/server/repositories/venues";

export default async function PublicFollowPage({
  params,
}: {
  params: Promise<{ venue: string }>;
}) {
  const { venue } = await params;
  const venueRecord = await getVenueBySlug(venue);

  if (!venueRecord) {
    notFound();
  }

  return (
    <main
      className="min-h-screen px-4 py-8 md:px-6 md:py-12"
      style={{
        "--accent": venueRecord.accent_color,
        background: "linear-gradient(180deg, #f8f4ee 0%, #fbfaf8 48%, #f5f1ea 100%)",
      } as CSSProperties}
    >
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 overflow-hidden rounded-[2rem] border border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,242,234,0.92))] px-5 py-6 shadow-[0_24px_70px_rgba(80,54,31,0.08)] md:px-7">
          <div className="flex items-center gap-3">
            {venueRecord.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={`${venueRecord.name} logo`}
                className="h-12 w-12 rounded-2xl border border-border object-cover"
                src={venueRecord.logo_url}
              />
            )}
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--accent)" }}>
                {venueRecord.name}
              </div>
              <h1 className="font-display text-4xl tracking-tight text-foreground md:text-5xl">
                Follow for updates
              </h1>
            </div>
          </div>
          {venueRecord.tagline && (
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground md:text-[15px]">
              {venueRecord.tagline}
            </p>
          )}
        </header>

        <PublicFollowCard returnPath={`/v/${venue}/follow`} venueSlug={venue} />
        <PublicPageAttribution />
      </div>
    </main>
  );
}

export const dynamic = "force-dynamic";

import type { Route } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Button, Card } from "@taproom/ui";

import { isPlatformAdmin } from "@/server/auth";
import { getVenueBySlug } from "@/server/repositories/venues";

export default async function ImpersonateVenuePage({ params }: { params: Promise<{ venue: string }> }) {
  const admin = await isPlatformAdmin();

  if (!admin) {
    redirect("/");
  }

  const { venue: venueSlug } = await params;
  const venue = await getVenueBySlug(venueSlug);

  if (!venue) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 lg:px-8">
      <Card className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Internal impersonation</p>
          <h1 className="font-display text-4xl text-ink">{venue.name}</h1>
          <p className="text-sm leading-6 text-ink/65">
            Platform admins can open any venue shell directly in MVP. Dedicated impersonation audit tooling is
            deferred, but this route preserves the intended workflow and handoff point.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-pine px-5 text-sm font-semibold text-parchment shadow-panel transition hover:bg-pine/90"
            href={`/app/${venue.slug}/setup` as Route}
          >
            Open setup
          </Link>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-ink/10 bg-white px-5 text-sm font-semibold text-ink transition hover:border-ink/20"
            href={`/app/${venue.slug}/items` as Route}
          >
            Jump to items
          </Link>
        </div>
      </Card>
    </main>
  );
}

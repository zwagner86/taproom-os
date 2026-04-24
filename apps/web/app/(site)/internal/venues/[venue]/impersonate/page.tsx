export const dynamic = "force-dynamic";

import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DEMO_VENUE_SLUG } from "@/lib/demo-venue";
import { Badge, Button, Card, PageHeader } from "@/components/ui";
import { requirePlatformAdmin, resolveImpersonationTarget } from "@/server/auth";
import { getVenueBySlug } from "@/server/repositories/venues";

export default async function ImpersonateVenuePage({
  params,
  searchParams,
}: {
  params: Promise<{ venue: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  await requirePlatformAdmin();

  const [{ venue: venueSlug }, { next }] = await Promise.all([params, searchParams]);
  const venue = await getVenueBySlug(venueSlug);

  if (!venue) {
    notFound();
  }

  const requestedTarget = resolveImpersonationTarget(venue.slug, next);
  const defaultTarget = `/app/${venue.slug}/setup`;
  const primaryLabel = requestedTarget === defaultTarget ? "Open setup" : "Continue to requested screen";

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-10">
      <Button asChild className="mb-4" size="sm" variant="ghost">
        <Link href="/internal">Back to internal</Link>
      </Button>
      <PageHeader
        subtitle={`/${venue.slug} · ${venue.venue_type}`}
        title={venue.name}
      />

      <Card className="mt-6 border-border/80 bg-white/88 shadow-[0_18px_48px_rgba(80,54,31,0.08)]">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge variant="accent">Platform admin</Badge>
          <Badge variant="info">Impersonation</Badge>
          {venue.slug === DEMO_VENUE_SLUG && <Badge variant="warning">Demo mode</Badge>}
        </div>
        <p className="mb-6 max-w-2xl text-sm leading-7 text-muted-foreground">
          This is the explicit internal handoff into venue admin. Dedicated impersonation audit tooling is deferred for
          now, but platform-admin entry stays intentionally visible instead of acting like a hidden shortcut.
        </p>

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href={requestedTarget as Route}>{primaryLabel}</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={`/app/${venue.slug}/items` as Route}>Jump to items</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={`/app/${venue.slug}/displays` as Route}>Displays</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={`/app/${venue.slug}/events` as Route}>Events</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={`/app/${venue.slug}/billing` as Route}>Billing</Link>
          </Button>
        </div>
      </Card>
    </main>
  );
}

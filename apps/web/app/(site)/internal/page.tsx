export const dynamic = "force-dynamic";

import type { Route } from "next";
import Link from "next/link";

import { Badge, Button, Card, EmptyState, PageHeader } from "@/components/ui";
import { DEMO_VENUE_SLUG } from "@/lib/demo-venue";
import { requirePlatformAdmin } from "@/server/auth";
import { listVenuesForUser } from "@/server/repositories/venues";

export default async function InternalDashboardPage() {
  const user = await requirePlatformAdmin();
  const venues = await listVenuesForUser(user);
  const demoVenue = venues.find((venue) => venue.slug === DEMO_VENUE_SLUG) ?? null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
      <PageHeader
        subtitle="Demo access, venue impersonation, and operator-assisted provisioning."
        title="Platform Admin"
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/80 bg-white/88 shadow-[0_18px_48px_rgba(80,54,31,0.08)]">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge variant="accent">Demo tools</Badge>
            <Badge variant="info">{DEMO_VENUE_SLUG}</Badge>
          </div>
          <div className="space-y-3">
            <div className="text-lg font-semibold text-foreground">Demo venue admin</div>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
              Use the seeded demo venue to preview the admin experience, including the tab-local demo mode that keeps
              changes out of the database.
            </p>
            {demoVenue ? (
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link href={`/internal/venues/${demoVenue.slug}/impersonate` as Route}>Open demo admin</Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href={`/v/${demoVenue.slug}/menu` as Route}>Open public demo venue</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-2xl border border-dashed border-border bg-background/70 px-4 py-3 text-sm leading-7 text-muted-foreground">
                  The demo venue is not seeded in this environment yet. Run <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs">supabase/seed.sql</code> to enable the full demo flow.
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button disabled type="button">Open demo admin</Button>
                  <Button disabled type="button" variant="secondary">Open public demo venue</Button>
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card className="border-border/80 bg-white/88 shadow-[0_18px_48px_rgba(80,54,31,0.08)]">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge variant="accent">Provisioning</Badge>
          </div>
          <div className="space-y-3">
            <div className="text-lg font-semibold text-foreground">Venue shell creation</div>
            <p className="text-sm leading-7 text-muted-foreground">
              Create venue shells, attach owners, and hand operators into their own admin surfaces from the internal
              provisioning screen.
            </p>
            <Button asChild variant="secondary">
              <Link href="/internal/venues">Open provisioning</Link>
            </Button>
          </div>
        </Card>
      </div>

      <div className="mt-8 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Venue access
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              Enter venue admin through an explicit impersonation handoff.
            </div>
          </div>
          <Button asChild size="sm" variant="ghost">
            <Link href="/internal/venues">Provision venues</Link>
          </Button>
        </div>

        {venues.length === 0 ? (
          <EmptyState
            description="Create a venue shell first, or seed the demo venue to unlock the internal admin workflow."
            title="No venues available yet"
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {venues.map((venue) => (
              <Card
                className="border-border/80 bg-white/88 shadow-[0_14px_40px_rgba(80,54,31,0.06)]"
                key={venue.id}
              >
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <Badge variant="info">{venue.venue_type}</Badge>
                  {venue.slug === DEMO_VENUE_SLUG && <Badge variant="warning">Demo mode</Badge>}
                </div>
                <div className="space-y-1">
                  <div className="text-lg font-semibold text-foreground">{venue.name}</div>
                  <div className="text-sm text-muted-foreground">/{venue.slug}</div>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button asChild>
                    <Link href={`/internal/venues/${venue.slug}/impersonate` as Route}>Impersonate</Link>
                  </Button>
                  <Button asChild variant="secondary">
                    <Link href={`/v/${venue.slug}/menu` as Route}>Public view</Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

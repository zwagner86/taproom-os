export const dynamic = "force-dynamic";

import type { Route } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Badge, Button, Card, PageHeader } from "@/components/ui";
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
    <main className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-10">
      <PageHeader
        subtitle={`/${venue.slug} · ${venue.venue_type}`}
        title={venue.name}
      />

      <Card className="mt-6 border-border/80 bg-white/88 shadow-[0_18px_48px_rgba(80,54,31,0.08)]">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge variant="accent">Platform admin</Badge>
          <Badge variant="info">Impersonation</Badge>
        </div>
        <p className="mb-6 max-w-2xl text-sm leading-7 text-muted-foreground">
          Platform admins can open any venue shell directly. Dedicated impersonation audit tooling is deferred, but
          this route preserves the intended workflow and handoff point.
        </p>

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href={`/app/${venue.slug}/setup` as Route}>Open setup</Link>
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

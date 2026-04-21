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
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-7">
        <div
          className="text-[11px] font-bold uppercase tracking-[0.8px] mb-1"
          style={{ color: "var(--accent)" }}
        >
          Platform admin · Impersonation
        </div>
        <h1 className="text-[28px] font-black tracking-[-0.5px] mb-1" style={{ color: "var(--c-text)" }}>
          {venue.name}
        </h1>
        <p className="text-[13.5px]" style={{ color: "var(--c-muted)" }}>
          /{venue.slug} · {venue.venue_type}
        </p>
      </div>

      <Card>
        <p className="text-[13.5px] mb-5 leading-relaxed" style={{ color: "var(--c-muted)" }}>
          Platform admins can open any venue shell directly. Dedicated impersonation audit tooling is deferred,
          but this route preserves the intended workflow and handoff point.
        </p>

        <div className="flex flex-wrap gap-3">
          <Link href={`/app/${venue.slug}/setup` as Route}>
            <Button>Open setup</Button>
          </Link>
          <Link href={`/app/${venue.slug}/items` as Route}>
            <Button variant="secondary">Jump to items</Button>
          </Link>
          <Link href={`/app/${venue.slug}/displays` as Route}>
            <Button variant="secondary">Displays</Button>
          </Link>
          <Link href={`/app/${venue.slug}/events` as Route}>
            <Button variant="secondary">Events</Button>
          </Link>
          <Link href={`/app/${venue.slug}/billing` as Route}>
            <Button variant="secondary">Billing</Button>
          </Link>
        </div>
      </Card>
    </main>
  );
}

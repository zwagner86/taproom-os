export const dynamic = "force-dynamic";

import type { Route } from "next";
import Link from "next/link";

import { Badge, Button, Card } from "@taproom/ui";

import { getOptionalUser, isPlatformAdmin } from "@/server/auth";
import { listVenuesForUser } from "@/server/repositories/venues";

const highlights = [
  "Unified content model for pours, food, merch, and events",
  "Cloudflare-ready Next.js runtime with Supabase-backed tenancy",
  "Admin, embed, public, and TV outputs from one venue record",
];

export default async function HomePage() {
  const user = await getOptionalUser();

  if (!user) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12 lg:px-8 lg:py-20">
        <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <Badge>Cloudflare + Supabase + Stripe Connect</Badge>
            <div className="space-y-4">
              <h1 className="max-w-3xl font-display text-5xl leading-tight text-ink sm:text-6xl">
                The operating layer for taprooms that rotate fast and stay simple.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-ink/70">
                TaproomOS is opinionated around pours, events, memberships, and public display surfaces. No kitchen
                workflows, no restaurant-ordering sprawl, no POS replacement.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-pine px-6 text-sm font-semibold text-parchment shadow-panel transition hover:bg-pine/90"
                href="/signup"
              >
                Create operator account
              </Link>
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-ink/10 bg-white/80 px-6 text-sm font-semibold text-ink transition hover:border-ink/20 hover:bg-white"
                href="/v/demo-taproom/menu"
              >
                View demo venue
              </Link>
            </div>
          </div>

          <Card className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">MVP working slice</p>
            <div className="space-y-3">
              {highlights.map((highlight) => (
                <div className="rounded-3xl bg-mist/50 px-4 py-4 text-sm leading-6 text-ink/70" key={highlight}>
                  {highlight}
                </div>
              ))}
            </div>
            <p className="text-sm leading-6 text-ink/60">
              Use the seeded `demo-taproom` venue for public page previews, then connect a real Supabase project to
              create operator accounts and venue records.
            </p>
          </Card>
        </section>
      </main>
    );
  }

  const [venues, admin] = await Promise.all([listVenuesForUser(user), isPlatformAdmin()]);

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-12 lg:px-8">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Badge>Operator dashboard</Badge>
          <h1 className="font-display text-4xl text-ink">Welcome back.</h1>
          <p className="max-w-2xl text-base leading-7 text-ink/65">
            Start with venue setup and items, then grow into events, memberships, notifications, and Square sync.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-ink/10 bg-white/80 px-5 text-sm font-semibold text-ink transition hover:border-ink/20 hover:bg-white"
            href="/onboarding"
          >
            Create a venue
          </Link>
          {admin ? (
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-pine px-5 text-sm font-semibold text-parchment shadow-panel transition hover:bg-pine/90"
              href="/internal/venues"
            >
              Internal venue tools
            </Link>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {venues.map((venue) => (
          <Card className="space-y-4" key={venue.id}>
            <div className="space-y-1">
              <Badge>{venue.venue_type}</Badge>
              <h2 className="font-display text-2xl text-ink">{venue.name}</h2>
              <p className="text-sm text-ink/55">/{venue.slug}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                className="rounded-2xl bg-pine px-4 py-3 text-center text-sm font-semibold text-parchment transition hover:bg-pine/90"
                href={`/app/${venue.slug}/items` as Route}
              >
                Manage items
              </Link>
              <Link
                className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-center text-sm font-semibold text-ink transition hover:border-ink/20"
                href={`/v/${venue.slug}/menu` as Route}
              >
                View public menu
              </Link>
            </div>
          </Card>
        ))}

        {venues.length === 0 ? (
          <Card className="space-y-4 md:col-span-2 xl:col-span-3">
            <h2 className="font-display text-2xl text-ink">No venues yet</h2>
            <p className="max-w-2xl text-sm leading-6 text-ink/65">
              Create a venue to start configuring terminology, branding, and the rotating taproom menu.
            </p>
            <div>
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-pine px-5 text-sm font-semibold text-parchment shadow-panel transition hover:bg-pine/90"
                href="/onboarding"
              >
                Launch venue onboarding
              </Link>
            </div>
          </Card>
        ) : null}
      </section>
    </main>
  );
}

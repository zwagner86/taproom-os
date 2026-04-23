export const dynamic = "force-dynamic";

import type { Route } from "next";
import Link from "next/link";

import { ArrowRight, Beer, CalendarDays, LayoutPanelTop, Tv } from "lucide-react";

import { Badge, Button, Card, EmptyState } from "@/components/ui";
import { getOptionalUser, isPlatformAdmin } from "@/server/auth";
import { listVenuesForUser } from "@/server/repositories/venues";

const highlights = [
  {
    icon: Beer,
    title: "One venue model",
    text: "Pours, food, merch, events, and memberships live in one system instead of getting split across tools.",
  },
  {
    icon: Tv,
    title: "Every surface stays aligned",
    text: "Admin, public pages, embeds, and TV displays all render from the same venue content and branding.",
  },
  {
    icon: CalendarDays,
    title: "Built for real taproom rhythm",
    text: "Fast rotating lists, free events, follow capture, and paid upgrades without restaurant workflow bloat.",
  },
];

export default async function HomePage() {
  const user = await getOptionalUser();

  if (!user) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
        <section className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
          <div className="space-y-6">
            <Badge variant="info">Cloudflare · Supabase · Stripe Connect</Badge>
            <div className="space-y-4">
              <h1 className="font-display text-5xl leading-[1.02] tracking-tight text-foreground md:text-6xl">
                The operating layer for taprooms that rotate fast.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
                TaproomOS is opinionated around pours, events, memberships, follows, and public display surfaces. No
                kitchen workflows, no restaurant-ordering sprawl, no POS replacement.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/signup">
                  Create operator account
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/v/demo-taproom/menu">View demo venue</Link>
              </Button>
            </div>
          </div>

          <Card
            className="overflow-hidden border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(248,242,234,0.92))] shadow-[0_28px_80px_rgba(80,54,31,0.12)]"
            style={{ padding: 0 }}
          >
            <div className="border-b border-border/70 px-6 py-5">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">What’s included</div>
              <div className="mt-2 text-lg font-semibold tracking-[-0.02em] text-foreground">
                A craft-venue-first product model
              </div>
            </div>
            <div className="grid gap-4 px-6 py-6">
              {highlights.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    className="rounded-3xl border border-border/70 bg-white/70 px-5 py-4"
                    key={item.title}
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="text-base font-semibold text-foreground">{item.title}</div>
                    </div>
                    <p className="text-sm leading-7 text-muted-foreground">{item.text}</p>
                  </div>
                );
              })}
              <div className="rounded-3xl border border-dashed border-border px-5 py-4 text-sm leading-7 text-muted-foreground">
                Use the seeded <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs">demo-taproom</code>{" "}
                venue for public page previews, then connect a real Supabase project to create operator accounts.
              </div>
            </div>
          </Card>
        </section>
      </main>
    );
  }

  const [venues, admin] = await Promise.all([listVenuesForUser(user), isPlatformAdmin()]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
      <section className="mb-8 rounded-[2rem] border border-border/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(248,242,234,0.9))] px-6 py-7 shadow-[0_24px_70px_rgba(80,54,31,0.08)]">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <Badge variant="accent">Operator home</Badge>
            <h1 className="font-display text-4xl tracking-tight text-foreground">Welcome back.</h1>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
              Start with venue setup and items, then expand into events, memberships, notifications, and displays.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="secondary">
              <Link href="/onboarding">+ New venue</Link>
            </Button>
            {admin && (
              <Button asChild variant="ghost">
                <Link href="/internal/venues">Internal tools</Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {venues.length === 0 ? (
        <EmptyState
          action={
            <Button asChild>
              <Link href="/onboarding">Launch venue onboarding</Link>
            </Button>
          }
          icon={<LayoutPanelTop className="h-10 w-10" />}
          title="No venues yet"
          description="Create a venue to start configuring branding, terminology, displays, and the rotating taproom menu."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {venues.map((venue) => (
            <Card
              className="border-border/80 bg-white/88 shadow-[0_18px_48px_rgba(80,54,31,0.08)]"
              key={venue.id}
            >
              <div className="mb-5 space-y-2">
                <Badge variant="info">{venue.venue_type}</Badge>
                <div className="font-display text-2xl tracking-tight text-foreground">{venue.name}</div>
                <div className="text-sm text-muted-foreground">/{venue.slug}</div>
              </div>
              <div className="flex flex-col gap-2">
                <Button asChild>
                  <Link href={`/app/${venue.slug}/displays` as Route}>Manage displays</Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href={`/app/${venue.slug}/items` as Route}>Manage items</Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}

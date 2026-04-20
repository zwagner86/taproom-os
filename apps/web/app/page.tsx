export const dynamic = "force-dynamic";

import type { Route } from "next";
import Link from "next/link";

import { Badge, Button, Card } from "@taproom/ui";

import { getOptionalUser, isPlatformAdmin } from "@/server/auth";
import { listVenuesForUser } from "@/server/repositories/venues";

const highlights = [
  { icon: "🍺", text: "Unified content model for pours, food, merch, and events" },
  { icon: "⚡️", text: "Cloudflare-ready Next.js with Supabase-backed tenancy" },
  { icon: "📺", text: "Admin, embed, public, and TV display outputs from one venue record" },
];

export default async function HomePage() {
  const user = await getOptionalUser();

  if (!user) {
    return (
      <main className="mx-auto max-w-5xl px-5 py-16">
        <div className="grid grid-cols-[1.1fr_0.9fr] gap-8 items-start">
          <div>
            <Badge variant="info" style={{ marginBottom: 16 }}>Cloudflare · Supabase · Stripe Connect</Badge>
            <h1
              className="text-[52px] font-black tracking-[-1.5px] leading-[1.08] mb-5"
              style={{ color: "var(--c-text)", fontFamily: "Lora, serif" }}
            >
              The operating layer for taprooms that rotate fast.
            </h1>
            <p className="text-[16px] leading-relaxed mb-8" style={{ color: "var(--c-muted)" }}>
              TaproomOS is opinionated around pours, events, memberships, and public display surfaces. No kitchen
              workflows, no restaurant-ordering sprawl, no POS replacement.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link href="/signup">
                <Button size="lg">Create operator account</Button>
              </Link>
              <Link href="/v/demo-taproom/menu">
                <Button size="lg" variant="secondary">View demo venue</Button>
              </Link>
            </div>
          </div>

          <Card>
            <div className="text-[11px] font-bold uppercase tracking-[0.8px] mb-4" style={{ color: "var(--accent)" }}>
              What's included
            </div>
            <div className="flex flex-col gap-3">
              {highlights.map((h) => (
                <div
                  key={h.text}
                  className="flex items-start gap-3 rounded-lg px-3 py-2.5 text-[13.5px] leading-relaxed"
                  style={{ background: "var(--c-bg2)", color: "var(--c-muted)" }}
                >
                  <span className="text-[16px] flex-shrink-0">{h.icon}</span>
                  {h.text}
                </div>
              ))}
            </div>
            <div className="mt-4 text-[12.5px] leading-relaxed" style={{ color: "var(--c-muted)" }}>
              Use the seeded <code className="font-mono text-[11.5px]">demo-taproom</code> venue for public page previews,
              then connect a real Supabase project to create operator accounts.
            </div>
          </Card>
        </div>
      </main>
    );
  }

  const [venues, admin] = await Promise.all([listVenuesForUser(user), isPlatformAdmin()]);

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[28px] font-black tracking-[-0.5px] mb-1" style={{ color: "var(--c-text)" }}>
            Welcome back.
          </h1>
          <p className="text-[13.5px]" style={{ color: "var(--c-muted)" }}>
            Start with venue setup and items, then grow into events, memberships, and notifications.
          </p>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <Link href="/onboarding">
            <Button variant="secondary">+ New venue</Button>
          </Link>
          {admin && (
            <Link href="/internal/venues">
              <Button variant="ghost">Internal tools</Button>
            </Link>
          )}
        </div>
      </div>

      {venues.length === 0 ? (
        <Card>
          <div className="py-12 flex flex-col items-center text-center gap-4">
            <div className="text-[40px]">🏠</div>
            <div className="font-bold text-[17px]" style={{ color: "var(--c-text)" }}>No venues yet</div>
            <p className="text-[13.5px] max-w-xs leading-relaxed" style={{ color: "var(--c-muted)" }}>
              Create a venue to start configuring terminology, branding, and the rotating taproom menu.
            </p>
            <Link href="/onboarding">
              <Button>Launch venue onboarding</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {venues.map((venue) => (
            <Card key={venue.id}>
              <div className="mb-4">
                <Badge variant="info" style={{ marginBottom: 8, fontSize: 11 }}>{venue.venue_type}</Badge>
                <div className="font-bold text-[17px] tracking-[-0.3px]" style={{ color: "var(--c-text)" }}>
                  {venue.name}
                </div>
                <div className="text-[12.5px] mt-0.5" style={{ color: "var(--c-muted)" }}>/{venue.slug}</div>
              </div>
              <div className="flex flex-col gap-2">
                <Link
                  className="w-full block text-center rounded-lg px-3.5 py-2 text-[13px] font-semibold text-white transition"
                  href={`/app/${venue.slug}/items` as Route}
                  style={{ background: "var(--c-sidebar)" }}
                >
                  Manage items
                </Link>
                <Link
                  className="w-full block text-center rounded-lg border px-3.5 py-2 text-[13px] font-semibold transition"
                  href={`/v/${venue.slug}/menu` as Route}
                  style={{ borderColor: "var(--c-border)", color: "var(--c-text)" }}
                >
                  Public menu
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}

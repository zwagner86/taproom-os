// VenueSidebar is a card-based secondary navigation component intended for
// internal admin or future operator-facing route contexts that aren't yet
// implemented (e.g. /internal/[venue]). The active /app/[venue] shell uses
// AppShell instead. Do not delete — keep as the pill-nav pattern reference.
import type { Route } from "next";
import Link from "next/link";

import { Badge, Card } from "@/components/ui";

import type { VenueRow } from "@/server/repositories/venues";

const sections = [
  { href: "setup", label: "Setup" },
  { href: "items", label: "Items" },
  { href: "events", label: "Events" },
  { href: "memberships", label: "Memberships" },
  { href: "followers", label: "Followers" },
  { href: "notifications", label: "Notifications" },
  { href: "integrations/square", label: "Square" },
  { href: "billing", label: "Billing" },
];

export function VenueSidebar({ venue }: { venue: VenueRow }) {
  return (
    <Card className="sticky top-4 space-y-5 border-border/80 bg-white/88 shadow-[0_18px_48px_rgba(80,54,31,0.08)]">
      <div className="space-y-2">
        <Badge variant="accent">{venue.venue_type}</Badge>
        <div>
          <p className="font-display text-2xl text-foreground">{venue.name}</p>
          <p className="text-sm text-muted-foreground">{venue.slug}</p>
        </div>
      </div>

      <nav className="grid gap-2">
        {sections.map((section) => (
          <Link
            className="rounded-2xl border border-transparent bg-secondary/55 px-4 py-3 text-sm font-semibold text-muted-foreground transition hover:border-border hover:bg-white hover:text-foreground"
            href={`/app/${venue.slug}/${section.href}` as Route}
            key={section.href}
          >
            {section.label}
          </Link>
        ))}
      </nav>

      <div className="rounded-3xl bg-secondary/65 p-4 text-sm leading-7 text-muted-foreground">
        Operator-assisted onboarding is the default in MVP. Self-serve venue creation is available, but internal setup remains the fastest path.
      </div>
    </Card>
  );
}

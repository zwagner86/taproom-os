import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/server/auth";
import { requireVenueAccess } from "@/server/repositories/venues";

export default async function VenueLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ venue: string }>;
}) {
  const { venue } = await params;
  const [{ venue: venueRecord }, user] = await Promise.all([
    requireVenueAccess(venue),
    requireUser(),
  ]);

  const emailParts = ((user.email ?? "").split("@")[0] ?? "").split(".");
  const initials = emailParts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  const groups = [
    {
      id: "venue",
      label: "Venue Admin",
      items: [
        { href: `/app/${venue}/setup`, label: "Venue Setup" },
        { href: `/app/${venue}/items`, label: "Item Management" },
        { href: `/app/${venue}/events`, label: "Event Management" },
        { href: `/app/${venue}/memberships`, label: "Memberships" },
        { href: `/app/${venue}/followers`, label: "Followers" },
        { href: `/app/${venue}/notifications`, label: "Notifications" },
        { href: `/app/${venue}/billing`, label: "Billing & Payments" },
        { href: `/app/${venue}/integrations/square`, label: "Square Integration" },
      ],
    },
  ];

  return (
    <AppShell
      groups={groups}
      userInitials={initials || "JD"}
      userLabel={user.email ?? "Venue Admin"}
      venueName={venueRecord.name}
      venueSlug={venueRecord.slug}
      venueType={venueRecord.venue_type}
    >
      {children}
    </AppShell>
  );
}

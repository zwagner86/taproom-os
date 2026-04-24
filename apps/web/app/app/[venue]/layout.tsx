import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

import { VenueAdminShell } from "@/components/venue-admin-shell";
import { requireVenueAccess } from "@/server/repositories/venues";

export default async function VenueLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ venue: string }>;
}) {
  const { venue } = await params;
  const access = await requireVenueAccess(venue);
  const { user, venue: venueRecord } = access;

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
        { href: `/app/${venue}/displays`, label: "Displays" },
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
    <VenueAdminShell
      currentUserId={user.id}
      demoMode={access.isDemoVenue}
      groups={groups}
      internalHref={access.isPlatformAdmin ? "/internal" : undefined}
      platformAdminMode={access.isPlatformAdmin}
      userInitials={initials || "JD"}
      userLabel={user.email ?? "Venue Admin"}
      venue={venueRecord}
    >
      {children}
    </VenueAdminShell>
  );
}

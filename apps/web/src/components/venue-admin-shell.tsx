"use client";

import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { DemoVenueProvider, useDemoVenue } from "@/components/demo-venue-provider";
import type { VenueRow } from "@/server/repositories/venues";

type NavItem = { href: string; label: string };
type NavGroup = { id: string; items: NavItem[]; label: string };

export function VenueAdminShell({
  children,
  currentUserId,
  demoMode,
  groups,
  userInitials,
  userLabel,
  venue,
}: {
  children: ReactNode;
  currentUserId: string | null;
  demoMode: boolean;
  groups: NavGroup[];
  userInitials: string;
  userLabel: string;
  venue: VenueRow;
}) {
  return (
    <DemoVenueProvider currentUserId={currentUserId} demoMode={demoMode} initialVenue={venue}>
      <VenueAdminShellFrame groups={groups} userInitials={userInitials} userLabel={userLabel} venue={venue}>
        {children}
      </VenueAdminShellFrame>
    </DemoVenueProvider>
  );
}

function VenueAdminShellFrame({
  children,
  groups,
  userInitials,
  userLabel,
  venue,
}: {
  children: ReactNode;
  groups: NavGroup[];
  userInitials: string;
  userLabel: string;
  venue: VenueRow;
}) {
  const { demoMode, state } = useDemoVenue();
  const currentVenue = state.venue ?? venue;

  return (
    <AppShell
      demoMode={demoMode}
      groups={groups}
      userInitials={userInitials}
      userLabel={userLabel}
      venueName={currentVenue.name}
      venueSlug={currentVenue.slug}
      venueType={currentVenue.venue_type}
    >
      {children}
    </AppShell>
  );
}

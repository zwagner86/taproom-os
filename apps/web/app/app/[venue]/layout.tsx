import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

import { MobileShell } from "@taproom/ui";

import { VenueSidebar } from "@/components/venue-sidebar";
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

  return <MobileShell sidebar={<VenueSidebar venue={access.venue} />}>{children}</MobileShell>;
}

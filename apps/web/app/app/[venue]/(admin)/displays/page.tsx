export const dynamic = "force-dynamic";

import { Alert, PageHeader } from "@/components/ui";

import { DemoVenueDisplaysPage } from "@/components/demo-venue-displays-page";
import { DisplaysWorkspace } from "@/components/displays-workspace";
import {
  deleteDisplayPlaylistAction,
  deleteDisplayViewAction,
  saveDisplayPlaylistAction,
  saveDisplayViewAction,
} from "@/server/actions/displays";
import { listVenueDisplayPlaylists } from "@/server/repositories/display-playlists";
import { listVenueDisplayViews } from "@/server/repositories/display-views";
import { listVenueEvents } from "@/server/repositories/events";
import { listVenueItems, listVenueMenuSections } from "@/server/repositories/items";
import { listVenueMembershipPlans } from "@/server/repositories/memberships";
import { requireVenueAccess } from "@/server/repositories/venues";
import { getEnv } from "@/env";
import type { DisplayContent } from "@/lib/displays";

export default async function VenueDisplaysPage({
  params,
  searchParams,
}: {
  params: Promise<{ venue: string }>;
  searchParams: Promise<{
    content?: string;
    error?: string;
    message?: string;
    playlist?: string;
    surface?: string;
    tab?: string;
    view?: string;
  }>;
}) {
  const [{ venue }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const access = await requireVenueAccess(venue);
  const { venue: venueRecord } = access;
  const [views, playlists, menuSections, items, events, membershipPlans] = await Promise.all([
    listVenueDisplayViews(access.venue.id),
    listVenueDisplayPlaylists(access.venue.id),
    listVenueMenuSections(access.venue.id),
    listVenueItems(access.venue.id),
    listVenueEvents(access.venue.id),
    listVenueMembershipPlans(access.venue.id),
  ]);
  const displayContentCounts = getDisplayContentCounts({ events, items, membershipPlans });

  if (access.isDemoVenue) {
    return (
      <DemoVenueDisplaysPage
        appUrl={getEnv().NEXT_PUBLIC_APP_URL}
        initialError={resolvedSearchParams.error}
        initialPlaylists={playlists}
        initialSearchParams={resolvedSearchParams}
        initialVenue={venueRecord}
        initialViews={views}
        initialDisplayContentCounts={displayContentCounts}
        venueSlug={venue}
      />
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        subtitle={`Organize public views, saved TV/embed displays, and playlists for ${venueRecord.name}.`}
        title="Displays"
      />

      {resolvedSearchParams.message && <Alert variant="success">{resolvedSearchParams.message}</Alert>}
      {resolvedSearchParams.error && <Alert variant="error">{resolvedSearchParams.error}</Alert>}

      <DisplaysWorkspace
        appUrl={getEnv().NEXT_PUBLIC_APP_URL}
        deletePlaylistAction={deleteDisplayPlaylistAction.bind(null, venue)}
        deleteViewAction={deleteDisplayViewAction.bind(null, venue)}
        displayContentCounts={displayContentCounts}
        initialSearchParams={resolvedSearchParams}
        playlists={playlists}
        menuSections={menuSections}
        savePlaylistAction={saveDisplayPlaylistAction.bind(null, venue)}
        saveViewAction={saveDisplayViewAction.bind(null, venue)}
        venueSlug={venue}
        views={views}
      />
    </div>
  );
}

function getDisplayContentCounts({
  events,
  items,
  membershipPlans,
}: {
  events: Awaited<ReturnType<typeof listVenueEvents>>;
  items: Awaited<ReturnType<typeof listVenueItems>>;
  membershipPlans: Awaited<ReturnType<typeof listVenueMembershipPlans>>;
}): Record<DisplayContent, number> {
  const visibleItems = items.filter((item) => item.status === "active" || item.status === "coming_soon");
  const drinks = visibleItems.filter((item) => item.type === "pour").length;
  const food = visibleItems.filter((item) => item.type === "food").length;

  return {
    drinks,
    events: events.filter((event) => event.published && event.status === "published").length,
    food,
    memberships: membershipPlans.filter((plan) => plan.active).length,
    menu: drinks + food,
  };
}

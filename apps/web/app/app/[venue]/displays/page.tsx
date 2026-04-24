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
import { requireVenueAccess } from "@/server/repositories/venues";
import { getEnv } from "@/env";

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
  const [views, playlists] = await Promise.all([
    listVenueDisplayViews(access.venue.id),
    listVenueDisplayPlaylists(access.venue.id),
  ]);

  if (access.isDemoVenue) {
    return (
      <DemoVenueDisplaysPage
        appUrl={getEnv().NEXT_PUBLIC_APP_URL}
        initialError={resolvedSearchParams.error}
        initialPlaylists={playlists}
        initialSearchParams={resolvedSearchParams}
        initialVenue={venueRecord}
        initialViews={views}
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
        initialSearchParams={resolvedSearchParams}
        playlists={playlists}
        savePlaylistAction={saveDisplayPlaylistAction.bind(null, venue)}
        saveViewAction={saveDisplayViewAction.bind(null, venue)}
        venueSlug={venue}
        views={views}
      />
    </div>
  );
}

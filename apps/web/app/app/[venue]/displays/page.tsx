export const dynamic = "force-dynamic";

import { Alert } from "@taproom/ui";

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

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[28px] font-bold tracking-[-0.03em]" style={{ color: "var(--c-text)" }}>
          Displays
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed" style={{ color: "var(--c-muted)" }}>
          Organize public views, saved TV/embed displays, and playlists for {venueRecord.name}.
        </p>
      </div>

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

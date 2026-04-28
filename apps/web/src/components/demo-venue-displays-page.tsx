"use client";

import { useEffect, useState } from "react";

import { DemoMutationAlert } from "@/components/demo-mutation-alert";
import { useDemoVenue } from "@/components/demo-venue-provider";
import { DisplaysWorkspace } from "@/components/displays-workspace";
import { Alert, PageHeader } from "@/components/ui";
import type { DemoDisplayPlaylistRecord, DemoDisplayViewRecord } from "@/lib/demo-venue-state";
import type { DisplayContent } from "@/lib/displays";
import type { VenueRow } from "@/server/repositories/venues";

export function DemoVenueDisplaysPage({
  appUrl,
  initialError,
  initialDisplayContentCounts,
  initialPlaylists,
  initialSearchParams,
  initialVenue,
  initialViews,
  venueSlug,
}: {
  appUrl: string;
  initialError?: string;
  initialDisplayContentCounts?: Partial<Record<DisplayContent, number>>;
  initialPlaylists: DemoDisplayPlaylistRecord[];
  initialSearchParams: Record<string, string | string[] | undefined>;
  initialVenue: VenueRow;
  initialViews: DemoDisplayViewRecord[];
  venueSlug: string;
}) {
  const {
    deleteDisplayPlaylist,
    deleteDisplayView,
    dispatchSeedDisplays,
    saveDisplayPlaylist,
    saveDisplayView,
    state,
  } = useDemoVenue();
  const venue = state.venue ?? initialVenue;
  const views = state.displays.views ?? initialViews;
  const playlists = state.displays.playlists ?? initialPlaylists;
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [result, setResult] = useState<ReturnType<typeof saveDisplayView> | null>(null);

  useEffect(() => {
    dispatchSeedDisplays(initialViews, initialPlaylists);
  }, [dispatchSeedDisplays, initialPlaylists, initialViews]);

  return (
    <div className="space-y-5">
      <PageHeader
        subtitle={`Organize public views, saved TV/embed displays, and playlists for ${venue.name}.`}
        title="Displays"
      />

      <div className="space-y-4">
        <DemoMutationAlert onDismiss={() => setResult(null)} result={result} />
        {error && (
          <Alert onDismiss={() => setError(null)} variant="error">
            {error}
          </Alert>
        )}
      </div>

      <DisplaysWorkspace
        appUrl={appUrl}
        deletePlaylistAction={async (formData) => {
          try {
            setError(null);
            setResult(deleteDisplayPlaylist(formData));
          } catch (nextError) {
            setResult(null);
            setError(nextError instanceof Error ? nextError.message : "Unable to delete playlist.");
          }
        }}
        deleteViewAction={async (formData) => {
          try {
            setError(null);
            setResult(deleteDisplayView(formData));
          } catch (nextError) {
            setResult(null);
            setError(nextError instanceof Error ? nextError.message : "Unable to delete display view.");
          }
        }}
        displayContentCounts={initialDisplayContentCounts}
        initialSearchParams={initialSearchParams}
        playlists={playlists}
        savePlaylistAction={async (formData) => {
          try {
            setError(null);
            setResult(saveDisplayPlaylist(formData));
          } catch (nextError) {
            setResult(null);
            setError(nextError instanceof Error ? nextError.message : "Unable to save playlist.");
          }
        }}
        saveViewAction={async (formData) => {
          try {
            setError(null);
            setResult(saveDisplayView(formData));
          } catch (nextError) {
            setResult(null);
            setError(nextError instanceof Error ? nextError.message : "Unable to save display view.");
          }
        }}
        venueSlug={venueSlug}
        views={views}
      />
    </div>
  );
}

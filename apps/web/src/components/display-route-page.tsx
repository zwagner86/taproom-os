import { Card } from "@taproom/ui";
import { notFound } from "next/navigation";

import {
  buildSavedDisplayPath,
  getDefaultDisplayViewConfig,
  getDisplayContentFromSearchParams,
  type DisplaySurface,
  type SavedDisplaySurface,
  parseDisplayViewConfigFromSearchParams,
} from "@/lib/displays";
import { getVenueDisplayPlaylistBySurfaceAndSlug } from "@/server/repositories/display-playlists";
import { getVenueDisplayViewBySurfaceAndSlug, listVenueDisplayViews } from "@/server/repositories/display-views";
import { getVenueBySlug } from "@/server/repositories/venues";

import { DisplayPlaylistPlayer } from "./display-playlist-player";
import { DisplayView } from "./display-view";

type SearchParams = Record<string, string | string[] | undefined>;

export async function renderAdHocDisplaySurfacePage({
  searchParams,
  surface,
  venueSlug,
}: {
  searchParams: SearchParams;
  surface: DisplaySurface;
  venueSlug: string;
}) {
  const venue = await getVenueBySlug(venueSlug);

  if (!venue) {
    notFound();
  }

  const content = getDisplayContentFromSearchParams(searchParams, "menu");
  const defaults = getDefaultDisplayViewConfig(surface, content);
  const config = parseDisplayViewConfigFromSearchParams(searchParams, defaults);

  return <DisplayView config={{ ...config, surface }} venueSlug={venueSlug} />;
}

export async function renderSavedDisplaySurfacePage({
  displaySlug,
  searchParams,
  surface,
  venueSlug,
}: {
  displaySlug: string;
  searchParams: SearchParams;
  surface: SavedDisplaySurface;
  venueSlug: string;
}) {
  const venue = await getVenueBySlug(venueSlug);

  if (!venue) {
    notFound();
  }

  const [playlist, view] = await Promise.all([
    getVenueDisplayPlaylistBySurfaceAndSlug(venue.id, surface, displaySlug),
    getVenueDisplayViewBySurfaceAndSlug(venue.id, surface, displaySlug),
  ]);

  if (playlist) {
    const views = await listVenueDisplayViews(venue.id);
    const viewById = new Map(
      views
        .filter((entry) => entry.surface === surface && entry.slug)
        .map((entry) => [entry.id, entry]),
    );

    const slides = playlist.config.slides
      .map((slide) => {
        const referencedView = viewById.get(slide.viewId);

        if (!referencedView?.slug) {
          return null;
        }

        return {
          durationSeconds: slide.durationSeconds,
          src: buildSavedDisplayPath(venueSlug, referencedView.slug, surface),
          title: `${venue.name} ${referencedView.name ?? referencedView.content}`,
        };
      })
      .filter((slide): slide is NonNullable<typeof slide> => Boolean(slide));

    return (
      <main className={surface === "tv" ? "min-h-screen bg-black px-6 py-6" : "min-h-screen px-4 py-4"}>
        <div className="mx-auto h-[calc(100vh-2rem)] max-w-[1600px]">
          <DisplayPlaylistPlayer slides={slides} />
        </div>
      </main>
    );
  }

  if (!view) {
    notFound();
  }

  const config = parseDisplayViewConfigFromSearchParams(searchParams, view.config);

  return <DisplayView config={{ ...config, surface }} venueSlug={venueSlug} />;
}

export function DisplayPresetNotReadyCard({ message }: { message: string }) {
  return (
    <Card>
      <div className="py-10 text-center text-[13.5px]" style={{ color: "var(--c-muted)" }}>
        {message}
      </div>
    </Card>
  );
}

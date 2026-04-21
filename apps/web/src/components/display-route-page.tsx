import { Card } from "@taproom/ui";
import { notFound } from "next/navigation";

import {
  applyDisplaySurfaceRules,
  buildPresetDisplayPath,
  getDefaultDisplayViewConfig,
  getDisplayContentFromSearchParams,
  type DisplaySurface,
  parseDisplayViewConfigFromSearchParams,
} from "@/lib/displays";
import { getPublicDisplayPreset, listVenueDisplayPresets } from "@/server/repositories/display-presets";
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

export async function renderPresetDisplaySurfacePage({
  presetSlug,
  searchParams,
  surface,
  venueSlug,
}: {
  presetSlug: string;
  searchParams: SearchParams;
  surface: DisplaySurface;
  venueSlug: string;
}) {
  const { preset, venue } = await getPublicDisplayPreset(venueSlug, presetSlug);

  if (!venue || !preset) {
    notFound();
  }

  if (preset.kind === "playlist") {
    const presets = await listVenueDisplayPresets(venue.id);
    const viewPresetSlugs = new Set(
      presets.filter((entry) => entry.kind === "view").map((entry) => entry.slug),
    );

    const slides = preset.config.slides
      .filter((slide) => viewPresetSlugs.has(slide.presetSlug))
      .map((slide) => ({
        durationSeconds: slide.durationSeconds,
        src: buildPresetDisplayPath(venueSlug, slide.presetSlug, surface),
        title: `${venue.name} ${slide.presetSlug}`,
      }));

    return (
      <main className={surface === "tv" ? "min-h-screen bg-black px-6 py-6" : "min-h-screen px-4 py-4"}>
        <div className="mx-auto h-[calc(100vh-2rem)] max-w-[1600px]">
          <DisplayPlaylistPlayer slides={slides} />
        </div>
      </main>
    );
  }

  const baseConfig = applyDisplaySurfaceRules({
    ...preset.config,
    surface,
  });
  const config = parseDisplayViewConfigFromSearchParams(searchParams, baseConfig);

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

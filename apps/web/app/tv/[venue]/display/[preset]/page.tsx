export const dynamic = "force-dynamic";

import { renderSavedDisplaySurfacePage } from "@/components/display-route-page";

export default async function TvDisplayPresetPage({
  params,
  searchParams,
}: {
  params: Promise<{ venue: string; preset: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ preset, venue }, resolvedSearchParams] = await Promise.all([params, searchParams]);

  return renderSavedDisplaySurfacePage({
    displaySlug: preset,
    searchParams: resolvedSearchParams,
    surface: "tv",
    venueSlug: venue,
  });
}

export const dynamic = "force-dynamic";

import { renderPresetDisplaySurfacePage } from "@/components/display-route-page";

export default async function PublicDisplayPresetPage({
  params,
  searchParams,
}: {
  params: Promise<{ venue: string; preset: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ preset, venue }, resolvedSearchParams] = await Promise.all([params, searchParams]);

  return renderPresetDisplaySurfacePage({
    presetSlug: preset,
    searchParams: resolvedSearchParams,
    surface: "public",
    venueSlug: venue,
  });
}

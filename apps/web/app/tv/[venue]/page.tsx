export const dynamic = "force-dynamic";

import { DisplayView } from "@/components/display-view";
import { getDefaultDisplayViewConfig, parseDisplayViewConfigFromSearchParams } from "@/lib/displays";

export default async function TvMenuPage({
  params,
  searchParams,
}: {
  params: Promise<{ venue: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ venue }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const defaults = getDefaultDisplayViewConfig("tv", "menu");
  const config = parseDisplayViewConfigFromSearchParams(resolvedSearchParams, defaults);

  return <DisplayView config={{ ...config, content: "menu", surface: "tv" }} venueSlug={venue} />;
}

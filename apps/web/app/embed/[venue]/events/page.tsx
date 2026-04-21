export const dynamic = "force-dynamic";

import { DisplayView } from "@/components/display-view";
import { getDefaultDisplayViewConfig, parseDisplayViewConfigFromSearchParams } from "@/lib/displays";

export default async function EmbedEventsPage({
  params,
  searchParams,
}: {
  params: Promise<{ venue: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ venue }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const defaults = getDefaultDisplayViewConfig("embed", "events");
  const config = parseDisplayViewConfigFromSearchParams(resolvedSearchParams, defaults);

  return <DisplayView config={{ ...config, content: "events", surface: "embed" }} venueSlug={venue} />;
}

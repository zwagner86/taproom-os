export const dynamic = "force-dynamic";

import { DisplayView } from "@/components/display-view";
import { getDefaultDisplayViewConfig, parseDisplayViewConfigFromSearchParams } from "@/lib/displays";

export default async function EmbedMenuPage({
  params,
  searchParams,
}: {
  params: Promise<{ venue: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ venue }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const defaults = getDefaultDisplayViewConfig("embed", "menu");
  const config = parseDisplayViewConfigFromSearchParams(resolvedSearchParams, defaults);

  return <DisplayView config={{ ...config, content: "menu", surface: "embed" }} venueSlug={venue} />;
}

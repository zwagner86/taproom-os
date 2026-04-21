export const dynamic = "force-dynamic";

import { DisplayView } from "@/components/display-view";
import { getDefaultDisplayViewConfig, parseDisplayViewConfigFromSearchParams } from "@/lib/displays";

export default async function PublicDrinksPage({
  params,
  searchParams,
}: {
  params: Promise<{ venue: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ venue }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const defaults = getDefaultDisplayViewConfig("public", "drinks");
  const config = parseDisplayViewConfigFromSearchParams(resolvedSearchParams, defaults);

  return <DisplayView config={{ ...config, content: "drinks", surface: "public" }} venueSlug={venue} />;
}

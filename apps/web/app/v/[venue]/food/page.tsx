export const dynamic = "force-dynamic";

import { DisplayView } from "@/components/display-view";
import { getDefaultDisplayViewConfig, parseDisplayViewConfigFromSearchParams } from "@/lib/displays";

export default async function PublicFoodPage({
  params,
  searchParams,
}: {
  params: Promise<{ venue: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ venue }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const defaults = getDefaultDisplayViewConfig("public", "food");
  const config = parseDisplayViewConfigFromSearchParams(resolvedSearchParams, defaults);

  return <DisplayView config={{ ...config, content: "food", surface: "public" }} venueSlug={venue} />;
}

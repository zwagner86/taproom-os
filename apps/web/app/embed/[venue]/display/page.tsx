export const dynamic = "force-dynamic";

import { renderAdHocDisplaySurfacePage } from "@/components/display-route-page";

export default async function EmbedDisplayPage({
  params,
  searchParams,
}: {
  params: Promise<{ venue: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ venue }, resolvedSearchParams] = await Promise.all([params, searchParams]);

  return renderAdHocDisplaySurfacePage({
    searchParams: resolvedSearchParams,
    surface: "embed",
    venueSlug: venue,
  });
}

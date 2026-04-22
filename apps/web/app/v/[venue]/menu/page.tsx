export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";

import { DisplayView } from "@/components/display-view";
import { getCanonicalPublicDisplayViewConfig } from "@/server/repositories/display-views";

export default async function PublicMenuPage({
  params,
}: {
  params: Promise<{ venue: string }>;
}) {
  const { venue } = await params;
  const resolved = await getCanonicalPublicDisplayViewConfig(venue, "menu");

  if (!resolved) {
    notFound();
  }

  return <DisplayView config={resolved.config} venueSlug={venue} />;
}

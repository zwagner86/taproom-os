export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";

import { Alert } from "@/components/ui";
import { DisplayView } from "@/components/display-view";
import { getCanonicalPublicDisplayViewConfig } from "@/server/repositories/display-views";

export default async function PublicEventsPage({
  params,
  searchParams,
}: {
  params: Promise<{ venue: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const [{ venue }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const resolved = await getCanonicalPublicDisplayViewConfig(venue, "events");

  if (!resolved) {
    notFound();
  }

  const alerts = (
    <>
      {resolvedSearchParams.message && (
        <Alert variant="success">
          {resolvedSearchParams.message}
        </Alert>
      )}
      {resolvedSearchParams.error && (
        <Alert variant="error">
          {resolvedSearchParams.error}
        </Alert>
      )}
    </>
  );

  return (
    <DisplayView
      alerts={resolvedSearchParams.error || resolvedSearchParams.message ? alerts : null}
      config={resolved.config}
      venueSlug={venue}
    />
  );
}

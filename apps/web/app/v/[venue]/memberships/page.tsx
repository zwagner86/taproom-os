export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";

import { Alert } from "@/components/ui";
import { DisplayView } from "@/components/display-view";
import { getCanonicalPublicDisplayViewConfig } from "@/server/repositories/display-views";

export default async function PublicMembershipsPage({
  params,
  searchParams,
}: {
  params: Promise<{ venue: string }>;
  searchParams: Promise<{ checkout?: string; error?: string; message?: string }>;
}) {
  const [{ venue }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const resolved = await getCanonicalPublicDisplayViewConfig(venue, "memberships");

  if (!resolved) {
    notFound();
  }

  const alerts = (
    <>
      {resolvedSearchParams.checkout === "success" && (
        <Alert variant="success">
          Checkout completed. Your membership will confirm shortly.
        </Alert>
      )}
      {resolvedSearchParams.checkout === "cancel" && (
        <Alert variant="warning">
          Checkout was canceled before subscription creation.
        </Alert>
      )}
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
      alerts={
        resolvedSearchParams.checkout || resolvedSearchParams.error || resolvedSearchParams.message
          ? alerts
          : null
      }
      config={resolved.config}
      venueSlug={venue}
    />
  );
}

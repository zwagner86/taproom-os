export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";

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
        <div className="rounded-[10px] border border-green-200 bg-green-50 px-4 py-3 text-[13px] text-green-800">
          {resolvedSearchParams.message}
        </div>
      )}
      {resolvedSearchParams.error && (
        <div className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
          {resolvedSearchParams.error}
        </div>
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

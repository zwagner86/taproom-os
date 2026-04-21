export const dynamic = "force-dynamic";

import { DisplayView } from "@/components/display-view";
import { getDefaultDisplayViewConfig, parseDisplayViewConfigFromSearchParams } from "@/lib/displays";

export default async function PublicEventsPage({
  params,
  searchParams,
}: {
  params: Promise<{ venue: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const [{ venue }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const defaults = getDefaultDisplayViewConfig("public", "events");
  const config = parseDisplayViewConfigFromSearchParams(resolvedSearchParams, defaults);
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
      config={{ ...config, content: "events", surface: "public" }}
      venueSlug={venue}
    />
  );
}

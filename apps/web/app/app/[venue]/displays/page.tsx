export const dynamic = "force-dynamic";

import Link from "next/link";

import { Alert, Button } from "@taproom/ui";

import { DisplayPresetEditor } from "@/components/display-preset-editor";
import { DisplayPresetList } from "@/components/display-preset-list";
import { saveDisplayPresetAction, deleteDisplayPresetAction } from "@/server/actions/displays";
import { listVenueDisplayPresets } from "@/server/repositories/display-presets";
import { requireVenueAccess } from "@/server/repositories/venues";
import { getEnv } from "@/env";

export default async function VenueDisplaysPage({
  params,
  searchParams,
}: {
  params: Promise<{ venue: string }>;
  searchParams: Promise<{ error?: string; message?: string; preset?: string }>;
}) {
  const [{ venue }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const access = await requireVenueAccess(venue);
  const { venue: venueRecord } = access;
  const presets = await listVenueDisplayPresets(access.venue.id);

  const selectedPreset = presets.find((preset) => preset.slug === resolvedSearchParams.preset) ?? null;
  const saveAction = saveDisplayPresetAction.bind(null, venue);
  const deleteAction = deleteDisplayPresetAction.bind(null, venue);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.03em]" style={{ color: "var(--c-text)" }}>
            Displays
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed" style={{ color: "var(--c-muted)" }}>
            Reusable public, TV, and embed views for {venueRecord.name}.
          </p>
        </div>
        <Link href={`/app/${venue}/displays`}>
          <Button className="self-start" size="sm">+ New preset</Button>
        </Link>
      </div>

      {resolvedSearchParams.message && <Alert className="mb-5" variant="success">{resolvedSearchParams.message}</Alert>}
      {resolvedSearchParams.error && <Alert className="mb-5" variant="error">{resolvedSearchParams.error}</Alert>}

      <section
        className="overflow-hidden rounded-[28px] border shadow-panel"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.98), color-mix(in srgb, var(--c-bg2) 74%, white))",
          borderColor: "var(--c-border)",
        }}
      >
        <div className="grid lg:grid-cols-[270px_minmax(0,1fr)]">
          <DisplayPresetList
            presets={presets}
            selectedPresetId={selectedPreset?.id ?? null}
            venueSlug={venue}
          />

          <DisplayPresetEditor
            appUrl={getEnv().NEXT_PUBLIC_APP_URL}
            deleteAction={deleteAction}
            presets={presets}
            saveAction={saveAction}
            selectedPreset={selectedPreset}
            venueSlug={venue}
          />
        </div>
      </section>
    </div>
  );
}

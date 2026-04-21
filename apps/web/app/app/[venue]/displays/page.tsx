export const dynamic = "force-dynamic";

import Link from "next/link";

import { Alert, Badge, Button, Card, PageHeader } from "@taproom/ui";

import { DisplayPresetEditor } from "@/components/display-preset-editor";
import { DISPLAY_CONTENT_LABELS, DISPLAY_SURFACE_LABELS, buildPresetDisplayPath } from "@/lib/displays";
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
    <div>
      <PageHeader
        actions={(
          <Link href={`/app/${venue}/displays`}>
            <Button variant="secondary">New preset</Button>
          </Link>
        )}
        subtitle={`Reusable public, TV, and embed views for ${venueRecord.name}.`}
        title="Displays"
      />

      {resolvedSearchParams.message && <Alert className="mb-5" variant="success">{resolvedSearchParams.message}</Alert>}
      {resolvedSearchParams.error && <Alert className="mb-5" variant="error">{resolvedSearchParams.error}</Alert>}

      <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
        <div className="flex flex-col gap-4">
          <Card>
            <div className="mb-3 text-sm font-semibold" style={{ color: "var(--c-text)" }}>
              Saved presets
            </div>
            <p className="text-[13px]" style={{ color: "var(--c-muted)" }}>
              Save a single view once, then reuse it across public pages, embeds, TVs, and playlists.
            </p>
          </Card>

          {presets.length === 0 ? (
            <Card>
              <div className="py-6 text-center">
                <div className="mb-2 text-[30px]">📺</div>
                <p className="text-[13.5px]" style={{ color: "var(--c-muted)" }}>
                  No display presets yet. Start with a single view, then build playlists from those saved slides.
                </p>
              </div>
            </Card>
          ) : (
            presets.map((preset) => (
              <Card key={preset.id}>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-[16px]" style={{ color: "var(--c-text)" }}>
                      {preset.name}
                    </div>
                    <div className="mt-1 text-[12px]" style={{ color: "var(--c-muted)" }}>
                      /{preset.slug}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-end">
                    <Badge variant="accent">{preset.kind === "view" ? "View" : "Playlist"}</Badge>
                    <Badge variant="default">{DISPLAY_SURFACE_LABELS[preset.default_surface]}</Badge>
                    {preset.kind === "view" ? (
                      <Badge variant="info">{DISPLAY_CONTENT_LABELS[preset.config.content]}</Badge>
                    ) : (
                      <Badge variant="warning">{preset.config.slides.length} slides</Badge>
                    )}
                  </div>
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                  <Link href={`/app/${venue}/displays?preset=${preset.slug}`}>
                    <Button size="sm" variant={selectedPreset?.id === preset.id ? "primary" : "secondary"}>Edit</Button>
                  </Link>
                  <Link href={buildPresetDisplayPath(venue, preset.slug, "public")} target="_blank">
                    <Button size="sm" variant="ghost">Public</Button>
                  </Link>
                  <Link href={buildPresetDisplayPath(venue, preset.slug, "embed")} target="_blank">
                    <Button size="sm" variant="ghost">Embed</Button>
                  </Link>
                  <Link href={buildPresetDisplayPath(venue, preset.slug, "tv")} target="_blank">
                    <Button size="sm" variant="ghost">TV</Button>
                  </Link>
                </div>

                {preset.kind === "playlist" && preset.config.slides.length > 0 && (
                  <div className="rounded-xl border px-4 py-3 text-[12.5px]" style={{ borderColor: "var(--c-border)", color: "var(--c-muted)" }}>
                    {preset.config.slides.map((slide) => slide.presetSlug).join(" → ")}
                  </div>
                )}
              </Card>
            ))
          )}
        </div>

        <DisplayPresetEditor
          appUrl={getEnv().NEXT_PUBLIC_APP_URL}
          deleteAction={deleteAction}
          presets={presets}
          saveAction={saveAction}
          selectedPreset={selectedPreset}
          venueSlug={venue}
        />
      </div>
    </div>
  );
}

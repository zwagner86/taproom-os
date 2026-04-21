"use client";

import { useMemo, useState } from "react";

import { Badge, Button, Card, FieldHint, FieldLabel, Input, Select, Toggle } from "@taproom/ui";

import {
  DISPLAY_CONTENT_LABELS,
  DISPLAY_SURFACE_LABELS,
  applyDisplaySurfaceRules,
  buildAdHocDisplayPath,
  buildPresetDisplayPath,
  getDefaultDisplayViewConfig,
  type DisplayPlaylistConfig,
  type DisplayPresetKind,
  type DisplaySurface,
  type DisplayViewConfig,
} from "@/lib/displays";
import { slugify } from "@/lib/utils";

import { DisplayLinkField } from "./display-link-field";
import { DisplayPlaylistPlayer } from "./display-playlist-player";

type ClientPresetRecord = {
  default_surface: DisplaySurface;
  id: string;
  name: string;
  slug: string;
} & (
  | {
      config: DisplayViewConfig;
      kind: "view";
    }
  | {
      config: DisplayPlaylistConfig;
      kind: "playlist";
    }
);

const BOOLEAN_FIELDS: Array<{
  description: string;
  key: keyof Pick<
    DisplayViewConfig,
    | "showVenueName"
    | "showLogo"
    | "showTagline"
    | "showStyleMeta"
    | "showPrices"
    | "showAbv"
    | "showDescriptions"
    | "showCtas"
    | "showFollowCard"
    | "showMembershipForm"
  >;
  label: string;
}> = [
  { description: "Show the venue name above the display title.", key: "showVenueName", label: "Venue name" },
  { description: "Show the venue logo when one is available.", key: "showLogo", label: "Logo" },
  { description: "Show the venue tagline or subtitle copy.", key: "showTagline", label: "Tagline" },
  { description: "Show style, category, and other secondary item metadata.", key: "showStyleMeta", label: "Style metadata" },
  { description: "Show prices when a displayable price exists.", key: "showPrices", label: "Prices" },
  { description: "Show ABV details for drink items.", key: "showAbv", label: "ABV" },
  { description: "Show item, event, or plan descriptions.", key: "showDescriptions", label: "Descriptions" },
  { description: "Show links back to the full public page.", key: "showCtas", label: "CTAs" },
  { description: "Show the follow/signup card on public views.", key: "showFollowCard", label: "Follow card" },
  { description: "Show the membership checkout form when the venue can sell memberships.", key: "showMembershipForm", label: "Membership form" },
];

export function DisplayPresetEditor({
  appUrl,
  deleteAction,
  presets,
  saveAction,
  selectedPreset,
  venueSlug,
}: {
  appUrl: string;
  deleteAction: (formData: FormData) => void | Promise<void>;
  presets: ClientPresetRecord[];
  saveAction: (formData: FormData) => void | Promise<void>;
  selectedPreset: ClientPresetRecord | null;
  venueSlug: string;
}) {
  const initialKind = selectedPreset?.kind ?? "view";
  const initialSurface = selectedPreset?.default_surface ?? "public";
  const initialViewConfig = selectedPreset?.kind === "view"
    ? selectedPreset.config
    : getDefaultDisplayViewConfig(initialSurface, "menu");
  const initialPlaylistConfig = selectedPreset?.kind === "playlist"
    ? selectedPreset.config
    : ({ slides: [] } satisfies DisplayPlaylistConfig);

  const [kind, setKind] = useState<DisplayPresetKind>(initialKind);
  const [defaultSurface, setDefaultSurface] = useState<DisplaySurface>(initialSurface);
  const [name, setName] = useState(selectedPreset?.name ?? "");
  const [slug, setSlug] = useState(selectedPreset?.slug ?? "");
  const [slugDirty, setSlugDirty] = useState(Boolean(selectedPreset?.slug));
  const [viewConfig, setViewConfig] = useState<DisplayViewConfig>(initialViewConfig);
  const [playlistConfig, setPlaylistConfig] = useState<DisplayPlaylistConfig>(initialPlaylistConfig);

  const viewPresets = useMemo(
    () => presets.filter((preset) => preset.kind === "view"),
    [presets],
  );

  const normalizedViewConfig = useMemo(
    () => applyDisplaySurfaceRules({ ...viewConfig, surface: defaultSurface }),
    [defaultSurface, viewConfig],
  );

  const adHocPath = useMemo(
    () => buildAdHocDisplayPath(venueSlug, normalizedViewConfig),
    [normalizedViewConfig, venueSlug],
  );
  const adHocUrl = `${appUrl}${adHocPath}`;

  const previewSlides = useMemo(
    () =>
      playlistConfig.slides.map((slide) => ({
        durationSeconds: slide.durationSeconds,
        src: buildPresetDisplayPath(venueSlug, slide.presetSlug, defaultSurface),
        title: `${slide.presetSlug} preview`,
      })),
    [defaultSurface, playlistConfig.slides, venueSlug],
  );

  const canShowPresetLinks = Boolean(selectedPreset && slug === selectedPreset.slug);
  const presetUrls = canShowPresetLinks
    ? {
        embed: `${appUrl}${buildPresetDisplayPath(venueSlug, slug, "embed")}`,
        public: `${appUrl}${buildPresetDisplayPath(venueSlug, slug, "public")}`,
        tv: `${appUrl}${buildPresetDisplayPath(venueSlug, slug, "tv")}`,
      }
    : null;

  const embedIframeSnippet = `<iframe src="${kind === "view" ? `${appUrl}${buildAdHocDisplayPath(venueSlug, {
    ...normalizedViewConfig,
    surface: "embed",
  })}` : presetUrls?.embed ?? ""}" width="100%" height="720" style="border:0;" loading="lazy"></iframe>`;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <Card>
        <form action={saveAction} className="flex flex-col gap-6">
          <input name="preset_id" type="hidden" value={selectedPreset?.id ?? ""} />
          <input
            name="config_json"
            type="hidden"
            value={JSON.stringify(kind === "view" ? normalizedViewConfig : playlistConfig)}
          />

          <div>
            <div className="mb-1 text-sm font-semibold" style={{ color: "var(--c-text)" }}>
              {selectedPreset ? "Edit preset" : "New preset"}
            </div>
            <p className="text-[13px]" style={{ color: "var(--c-muted)" }}>
              Build reusable public, embed, and TV outputs from one venue record.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <FieldLabel htmlFor="display-name" required>Preset name</FieldLabel>
              <Input
                aria-describedby="display-name-hint"
                id="display-name"
                name="name"
                onChange={(event) => {
                  const nextName = event.target.value;
                  setName(nextName);

                  if (!slugDirty) {
                    setSlug(slugify(nextName));
                  }
                }}
                placeholder="Mainroom playlist"
                required
                value={name}
              />
              <FieldHint id="display-name-hint">
                Use a clear name your team will recognize when sharing URLs or building playlists.
              </FieldHint>
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel
                htmlFor="display-slug"
                info="The slug becomes part of the stable `/display/[preset]` URL. Keep it short, lowercase, and easy to read on shared screens."
                required
              >
                Preset slug
              </FieldLabel>
              <Input
                aria-describedby="display-slug-hint"
                id="display-slug"
                name="slug"
                onChange={(event) => {
                  setSlugDirty(true);
                  setSlug(slugify(event.target.value));
                }}
                placeholder="mainroom-playlist"
                required
                value={slug}
              />
              <FieldHint id="display-slug-hint">
                This is the shareable URL key for the preset, such as `mainroom-playlist` or `drink-board`.
              </FieldHint>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-1">
              <FieldLabel
                htmlFor="display-kind"
                info="View presets render one configured screen. Playlist presets rotate through saved view presets in sequence."
              >
                Preset type
              </FieldLabel>
              <Select
                aria-describedby="display-kind-hint"
                id="display-kind"
                name="kind"
                onChange={(event) => setKind(event.target.value as DisplayPresetKind)}
                value={kind}
              >
                <option value="view">View preset</option>
                <option value="playlist">Playlist preset</option>
              </Select>
              <FieldHint id="display-kind-hint">
                Choose View for a single output, or Playlist to rotate through multiple saved views.
              </FieldHint>
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel
                htmlFor="display-surface"
                info="Surface applies sensible defaults for public pages, embeds, and unattended TV displays. You can still override the surface later with stable URLs."
              >
                Default surface
              </FieldLabel>
              <Select
                aria-describedby="display-surface-hint"
                id="display-surface"
                name="default_surface"
                onChange={(event) => {
                  const nextSurface = event.target.value as DisplaySurface;
                  setDefaultSurface(nextSurface);
                  setViewConfig((current) =>
                    applyDisplaySurfaceRules({
                      ...getDefaultDisplayViewConfig(nextSurface, current.content),
                      ...current,
                      surface: nextSurface,
                    }),
                  );
                }}
                value={defaultSurface}
              >
                <option value="public">Public page</option>
                <option value="embed">Embed</option>
                <option value="tv">TV display</option>
              </Select>
              <FieldHint id="display-surface-hint">
                Pick the surface this preset should optimize for when admins first open or share it.
              </FieldHint>
            </div>
            <div className="rounded-xl border px-4 py-3" style={{ borderColor: "var(--c-border)", background: "var(--c-bg2)" }}>
              <div className="text-[11px] font-bold uppercase tracking-[0.08em]" style={{ color: "var(--c-muted)" }}>
                Active mode
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="accent">{kind === "view" ? "View" : "Playlist"}</Badge>
                <Badge variant="default">{DISPLAY_SURFACE_LABELS[defaultSurface]}</Badge>
              </div>
            </div>
          </div>

          {kind === "view" ? (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="flex flex-col gap-1 md:col-span-2">
                  <FieldLabel
                    htmlFor="display-content"
                    info="Content chooses which venue data set this view should render, such as drinks, food, events, or membership plans."
                  >
                    Content
                  </FieldLabel>
                  <Select
                    aria-describedby="display-content-hint"
                    id="display-content"
                    onChange={(event) => {
                      const nextContent = event.target.value as DisplayViewConfig["content"];
                      setViewConfig((current) =>
                        applyDisplaySurfaceRules({
                          ...getDefaultDisplayViewConfig(defaultSurface, nextContent),
                          ...current,
                          content: nextContent,
                          surface: defaultSurface,
                        }),
                      );
                    }}
                    value={viewConfig.content}
                  >
                    {Object.entries(DISPLAY_CONTENT_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                  <FieldHint id="display-content-hint">
                    Choose the venue content this display should show to guests on screen.
                  </FieldHint>
                </div>
                <div className="flex flex-col gap-1">
                  <FieldLabel
                    htmlFor="display-density"
                    info="Density controls how much content is shown at once. Compact fits more rows on screen, while Comfortable leaves more breathing room."
                  >
                    Density
                  </FieldLabel>
                  <Select
                    aria-describedby="display-density-hint"
                    id="display-density"
                    onChange={(event) =>
                      setViewConfig((current) => ({ ...current, density: event.target.value as DisplayViewConfig["density"] }))
                    }
                    value={viewConfig.density}
                  >
                    <option value="comfortable">Comfortable</option>
                    <option value="compact">Compact</option>
                  </Select>
                  <FieldHint id="display-density-hint">
                    Use Compact for tighter menu boards and Comfortable for more spacious, readable layouts.
                  </FieldHint>
                </div>
                <div className="flex flex-col gap-1">
                  <FieldLabel
                    htmlFor="display-aspect"
                    info="Aspect nudges the layout toward landscape or portrait screens when Auto is not giving the right result."
                  >
                    Aspect
                  </FieldLabel>
                  <Select
                    aria-describedby="display-aspect-hint"
                    id="display-aspect"
                    onChange={(event) =>
                      setViewConfig((current) => ({ ...current, aspect: event.target.value as DisplayViewConfig["aspect"] }))
                    }
                    value={viewConfig.aspect}
                  >
                    <option value="auto">Auto</option>
                    <option value="landscape">Landscape</option>
                    <option value="portrait">Portrait</option>
                  </Select>
                  <FieldHint id="display-aspect-hint">
                    Leave this on Auto unless you know the screen orientation and want to force a specific layout.
                  </FieldHint>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <FieldLabel
                  htmlFor="display-link-target"
                  info="Link target only affects clickable call-to-action links when the surface allows them."
                >
                  Link target
                </FieldLabel>
                <Select
                  aria-describedby="display-link-target-hint"
                  id="display-link-target"
                  onChange={(event) =>
                    setViewConfig((current) => ({ ...current, linkTarget: event.target.value as DisplayViewConfig["linkTarget"] }))
                  }
                  value={viewConfig.linkTarget}
                >
                  <option value="same-tab">Same tab</option>
                  <option value="new-tab">New tab</option>
                </Select>
                <FieldHint id="display-link-target-hint">
                  Use Same tab for kiosk-style browsing and New tab for embeds where you want to keep the host page open.
                </FieldHint>
              </div>

              <div>
                <div className="mb-3 text-sm font-semibold" style={{ color: "var(--c-text)" }}>
                  Display controls
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {BOOLEAN_FIELDS.map((field) => {
                    const disabled =
                      (field.key === "showFollowCard" && defaultSurface !== "public") ||
                      (field.key === "showMembershipForm" && (defaultSurface !== "public" || viewConfig.content !== "memberships"));
                    const hintId = `${field.key}-hint`;
                    const disabledHintId = `${field.key}-disabled-hint`;

                    return (
                      <div
                        className="rounded-xl border px-4 py-3"
                        key={field.key}
                        style={{ borderColor: "var(--c-border)", opacity: disabled ? 0.55 : 1 }}
                      >
                        <Toggle
                          checked={normalizedViewConfig[field.key]}
                          className="items-start"
                          describedBy={disabled ? `${hintId} ${disabledHintId}` : hintId}
                          id={field.key}
                          label={field.label}
                          onChange={(checked) =>
                            setViewConfig((current) => ({
                              ...current,
                              [field.key]: checked,
                            }))
                          }
                        />
                        <FieldHint className="mt-2 text-[12.5px]" id={hintId}>
                          {field.description}
                        </FieldHint>
                        {disabled && (
                          <FieldHint className="mt-1" id={disabledHintId}>
                            {field.key === "showFollowCard"
                              ? "Follow cards are public-only."
                              : "Membership forms only appear on public membership views."}
                          </FieldHint>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-4">
              <div>
                <div className="mb-1 text-sm font-semibold" style={{ color: "var(--c-text)" }}>
                  Playlist slides
                </div>
                <p className="text-[13px]" style={{ color: "var(--c-muted)" }}>
                  Playlists can only reference saved view presets.
                </p>
              </div>

              {playlistConfig.slides.map((slide, index) => (
                <div
                  className="grid gap-3 rounded-xl border p-4 md:grid-cols-[1.8fr_0.8fr_auto]"
                  key={`${slide.presetSlug}-${index}`}
                  style={{ borderColor: "var(--c-border)" }}
                >
                  <div className="flex flex-col gap-1">
                    <FieldLabel
                      htmlFor={`playlist-slide-${index}`}
                      info="Each playlist slide references one saved view preset, so update the underlying view once and every playlist can inherit it."
                    >
                      View preset
                    </FieldLabel>
                    <Select
                      aria-describedby={`playlist-slide-${index}-hint`}
                      id={`playlist-slide-${index}`}
                      onChange={(event) =>
                        setPlaylistConfig((current) => ({
                          slides: current.slides.map((entry, slideIndex) =>
                            slideIndex === index
                              ? { ...entry, presetSlug: event.target.value }
                              : entry,
                          ),
                        }))
                      }
                      value={slide.presetSlug}
                    >
                      {viewPresets.length === 0 ? (
                        <option value="">No saved view presets yet</option>
                      ) : (
                        viewPresets.map((preset) => (
                          <option key={preset.id} value={preset.slug}>
                            {preset.name}
                          </option>
                        ))
                      )}
                    </Select>
                    <FieldHint id={`playlist-slide-${index}-hint`}>
                      Choose which saved view should appear for this step in the rotation.
                    </FieldHint>
                  </div>
                  <div className="flex flex-col gap-1">
                    <FieldLabel
                      htmlFor={`playlist-duration-${index}`}
                      info="Duration controls how long this slide stays visible before the playlist fades to the next one."
                    >
                      Seconds
                    </FieldLabel>
                    <Input
                      aria-describedby={`playlist-duration-${index}-hint`}
                      id={`playlist-duration-${index}`}
                      min={3}
                      onChange={(event) =>
                        setPlaylistConfig((current) => ({
                          slides: current.slides.map((entry, slideIndex) =>
                            slideIndex === index
                              ? { ...entry, durationSeconds: Number(event.target.value || 12) }
                              : entry,
                          ),
                        }))
                      }
                      type="number"
                      value={slide.durationSeconds}
                    />
                    <FieldHint id={`playlist-duration-${index}-hint`}>
                      Enter how many seconds this slide should stay on screen before advancing.
                    </FieldHint>
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={() =>
                        setPlaylistConfig((current) => ({
                          slides: current.slides.filter((_, slideIndex) => slideIndex !== index),
                        }))
                      }
                      type="button"
                      variant="ghost"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}

              <div>
                <Button
                  disabled={viewPresets.length === 0}
                  onClick={() =>
                    setPlaylistConfig((current) => ({
                      slides: [
                        ...current.slides,
                        {
                          durationSeconds: 12,
                          presetSlug: viewPresets[0]?.slug ?? "",
                          transition: "fade",
                        },
                      ],
                    }))
                  }
                  type="button"
                  variant="secondary"
                >
                  Add slide
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit">{selectedPreset ? "Save preset" : "Create preset"}</Button>
            {selectedPreset && (
              <Button formAction={deleteAction} type="submit" variant="ghost">
                Delete
              </Button>
            )}
          </div>
        </form>
      </Card>

      <div className="flex flex-col gap-6">
        <Card>
          <div className="mb-3 text-sm font-semibold" style={{ color: "var(--c-text)" }}>
            Live preview
          </div>
          <div className="h-[520px]">
            {kind === "view" ? (
              <iframe
                className="h-full w-full rounded-[18px] border border-rim"
                src={adHocPath}
                title="Display preview"
              />
            ) : (
              <DisplayPlaylistPlayer className="h-full min-h-0" slides={previewSlides} />
            )}
          </div>
        </Card>

        <Card className="flex flex-col gap-4">
          <div>
            <div className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>
              Share and embed
            </div>
            <p className="mt-1 text-[13px]" style={{ color: "var(--c-muted)" }}>
              Use the ad hoc URL for quick experiments. Save the preset to get stable reusable links.
            </p>
          </div>

          {kind === "view" && (
            <>
              <DisplayLinkField label="Ad hoc URL" value={adHocUrl} />
              <DisplayLinkField label="Embed iframe" multiline value={embedIframeSnippet} />
            </>
          )}

          {presetUrls ? (
            <>
              <DisplayLinkField label="Stable public URL" value={presetUrls.public} />
              <DisplayLinkField label="Stable embed URL" value={presetUrls.embed} />
              <DisplayLinkField label="Stable TV URL" value={presetUrls.tv} />
            </>
          ) : (
            <div className="rounded-xl border px-4 py-3 text-[13px]" style={{ borderColor: "var(--c-border)", color: "var(--c-muted)" }}>
              Save this preset to generate stable `/display/[preset]` URLs across public, embed, and TV surfaces.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

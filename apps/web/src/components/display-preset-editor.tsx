"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import { Button, FieldHint, FieldLabel, Input, Select, Toggle, cn } from "@taproom/ui";

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

export type DisplayPresetClientRecord = {
  default_surface: DisplaySurface;
  id: string;
  name: string;
  slug: string;
  updated_at?: string | null;
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

const SECTION_DIVIDER_STYLE = { borderColor: "var(--c-border)" } as const;
const PREVIEW_SCALE_BY_SURFACE: Record<DisplaySurface, number> = {
  embed: 0.6,
  public: 0.58,
  tv: 0.5,
};

function getInitialKind(selectedPreset: DisplayPresetClientRecord | null): DisplayPresetKind {
  return selectedPreset?.kind ?? "view";
}

function getInitialSurface(selectedPreset: DisplayPresetClientRecord | null): DisplaySurface {
  return selectedPreset?.default_surface ?? "public";
}

function getInitialViewConfig(selectedPreset: DisplayPresetClientRecord | null, surface: DisplaySurface) {
  return selectedPreset?.kind === "view"
    ? selectedPreset.config
    : getDefaultDisplayViewConfig(surface, "menu");
}

function getInitialPlaylistConfig(selectedPreset: DisplayPresetClientRecord | null): DisplayPlaylistConfig {
  return selectedPreset?.kind === "playlist"
    ? selectedPreset.config
    : ({ slides: [] } satisfies DisplayPlaylistConfig);
}

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
  presets: DisplayPresetClientRecord[];
  saveAction: (formData: FormData) => void | Promise<void>;
  selectedPreset: DisplayPresetClientRecord | null;
  venueSlug: string;
}) {
  const initialKind = getInitialKind(selectedPreset);
  const initialSurface = getInitialSurface(selectedPreset);
  const initialViewConfig = getInitialViewConfig(selectedPreset, initialSurface);
  const initialPlaylistConfig = getInitialPlaylistConfig(selectedPreset);
  const presetSyncKey = selectedPreset ? `${selectedPreset.id}:${selectedPreset.updated_at ?? ""}` : "new";

  const [kind, setKind] = useState<DisplayPresetKind>(initialKind);
  const [defaultSurface, setDefaultSurface] = useState<DisplaySurface>(initialSurface);
  const [name, setName] = useState(selectedPreset?.name ?? "");
  const [slug, setSlug] = useState(selectedPreset?.slug ?? "");
  const [slugDirty, setSlugDirty] = useState(Boolean(selectedPreset?.slug));
  const [viewConfig, setViewConfig] = useState<DisplayViewConfig>(initialViewConfig);
  const [playlistConfig, setPlaylistConfig] = useState<DisplayPlaylistConfig>(initialPlaylistConfig);

  useEffect(() => {
    const nextKind = getInitialKind(selectedPreset);
    const nextSurface = getInitialSurface(selectedPreset);

    setKind(nextKind);
    setDefaultSurface(nextSurface);
    setName(selectedPreset?.name ?? "");
    setSlug(selectedPreset?.slug ?? "");
    setSlugDirty(Boolean(selectedPreset?.slug));
    setViewConfig(getInitialViewConfig(selectedPreset, nextSurface));
    setPlaylistConfig(getInitialPlaylistConfig(selectedPreset));
  }, [presetSyncKey, selectedPreset]);

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
  const previewScale = PREVIEW_SCALE_BY_SURFACE[defaultSurface];

  return (
    <div className="grid min-w-0 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 border-b lg:border-b-0 lg:border-r" style={SECTION_DIVIDER_STYLE}>
        <form action={saveAction} className="flex h-full flex-col" data-display-editor-kind={kind}>
          <input name="preset_id" type="hidden" value={selectedPreset?.id ?? ""} />
          <input
            name="config_json"
            type="hidden"
            value={JSON.stringify(kind === "view" ? normalizedViewConfig : playlistConfig)}
          />

          <div className="border-b px-5 py-5 md:px-6 md:py-6" style={SECTION_DIVIDER_STYLE}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-[22px] font-semibold tracking-[-0.03em]" style={{ color: "var(--c-text)" }}>
                  {selectedPreset ? "Edit preset" : "New preset"}
                </div>
                <p className="mt-2 max-w-2xl text-[13px] leading-relaxed" style={{ color: "var(--c-muted)" }}>
                  Build reusable public, embed, and TV outputs from one venue record.
                </p>
              </div>
              <div className="rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ borderColor: "var(--c-border)", color: "var(--c-muted)", background: "rgba(255,255,255,0.8)" }}>
                {selectedPreset ? `/${selectedPreset.slug}` : "Unsaved preset"}
              </div>
            </div>
          </div>

          <EditorSection title="Identity">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1">
                <FieldLabel htmlFor="display-name" required>Preset name</FieldLabel>
                <Input
                  aria-describedby="display-name-hint"
                  className="bg-white"
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
                  className="bg-white"
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
          </EditorSection>

          <EditorSection title="Output type">
            <div className="grid gap-4 md:grid-cols-[1fr_1fr_0.9fr]">
              <div className="flex flex-col gap-1">
                <FieldLabel
                  htmlFor="display-kind"
                  info="View presets render one configured screen. Playlist presets rotate through saved view presets in sequence."
                >
                  Preset type
                </FieldLabel>
                <Select
                  aria-describedby="display-kind-hint"
                  className="bg-white"
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
                  className="bg-white"
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
              <div className="flex flex-col gap-2">
                <div className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--c-muted)" }}>
                  Active mode
                </div>
                <div className="rounded-[16px] border p-1" style={{ borderColor: "var(--c-border)", background: "color-mix(in srgb, var(--c-bg2) 72%, white)" }}>
                  <div className="grid grid-cols-2 gap-1">
                    <StatusSegment active label={kind === "view" ? "View" : "Playlist"} />
                    <StatusSegment active={false} label={DISPLAY_SURFACE_LABELS[defaultSurface]} />
                  </div>
                </div>
                <p className="text-[12px] leading-relaxed" style={{ color: "var(--c-muted)" }}>
                  {kind === "view"
                    ? "Single configured output with surface defaults."
                    : "Rotating saved views with fade transitions."}
                </p>
              </div>
            </div>
          </EditorSection>

          {kind === "view" ? (
            <>
              <EditorSection title="Display settings">
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
                      className="bg-white"
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
                      className="bg-white"
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
                      className="bg-white"
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

                <div className="mt-4 flex max-w-[320px] flex-col gap-1">
                  <FieldLabel
                    htmlFor="display-link-target"
                    info="Link target only affects clickable call-to-action links when the surface allows them."
                  >
                    Link target
                  </FieldLabel>
                  <Select
                    aria-describedby="display-link-target-hint"
                    className="bg-white"
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
              </EditorSection>

              <EditorSection title="Display controls">
                <div className="overflow-hidden rounded-[20px] border" style={{ borderColor: "var(--c-border)", background: "rgba(255,255,255,0.74)" }}>
                  <div className="grid md:grid-cols-2">
                    {BOOLEAN_FIELDS.map((field, index) => {
                      const disabled =
                        (field.key === "showFollowCard" && defaultSurface !== "public") ||
                        (field.key === "showMembershipForm" && (defaultSurface !== "public" || viewConfig.content !== "memberships"));
                      const hintId = `${field.key}-hint`;
                      const disabledHintId = `${field.key}-disabled-hint`;
                      const needsLeftBorder = index % 2 === 1;
                      const needsTopBorder = index > 1;

                      return (
                        <div
                          className={cn(
                            "px-4 py-4",
                            needsLeftBorder && "md:border-l",
                            needsTopBorder && "border-t",
                          )}
                          key={field.key}
                          style={{
                            borderColor: "var(--c-border)",
                            opacity: disabled ? 0.58 : 1,
                          }}
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
              </EditorSection>
            </>
          ) : (
            <EditorSection
              description={viewPresets.length === 0 ? "Create and save at least one view preset before building a playlist." : undefined}
              title="Playlist slides"
            >
              <div className="flex flex-col gap-3">
                {playlistConfig.slides.length === 0 ? (
                  <div className="rounded-[18px] border border-dashed border-rim px-4 py-5 text-[13px] leading-relaxed" style={{ color: "var(--c-muted)", background: "rgba(255,255,255,0.72)" }}>
                    Add saved view presets to build the playlist rotation.
                  </div>
                ) : (
                  playlistConfig.slides.map((slide, index) => (
                    <div
                      className="grid gap-3 rounded-[18px] border p-4 md:grid-cols-[1.8fr_0.8fr_auto]"
                      key={`${slide.presetSlug}-${index}`}
                      style={{ borderColor: "var(--c-border)", background: "rgba(255,255,255,0.78)" }}
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
                          className="bg-white"
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
                          className="bg-white"
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
                          size="sm"
                          type="button"
                          variant="ghost"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))
                )}

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
                    size="sm"
                    type="button"
                    variant="secondary"
                  >
                    Add slide
                  </Button>
                </div>
              </div>
            </EditorSection>
          )}

          <div className="mt-auto border-t px-5 py-5 md:px-6 md:py-6" style={SECTION_DIVIDER_STYLE}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-[12px] leading-relaxed" style={{ color: "var(--c-muted)" }}>
                {selectedPreset ? `Editing /${selectedPreset.slug}` : "Create the preset to generate stable share links."}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {selectedPreset && (
                  <Button formAction={deleteAction} size="sm" type="submit" variant="ghost">
                    Delete
                  </Button>
                )}
                <Button size="sm" type="submit">
                  {selectedPreset ? "Save preset" : "Create preset"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>

      <aside
        className="min-w-0"
        data-preview-kind={kind}
        style={{ background: "linear-gradient(180deg, rgba(250,247,243,0.96), rgba(255,255,255,0.98))" }}
      >
        <div className="border-b px-5 py-5 md:px-6 md:py-6" style={SECTION_DIVIDER_STYLE}>
          <SectionLabel title="Live preview" />
          <p className="mt-2 text-[13px] leading-relaxed" style={{ color: "var(--c-muted)" }}>
            Review the actual display output while you edit the preset.
          </p>

          <div className="mt-5 rounded-[22px] border p-3" style={{ borderColor: "rgba(15,23,42,0.08)", background: "rgba(255,255,255,0.86)" }}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--c-muted)" }}>
                {kind === "view" ? `${DISPLAY_SURFACE_LABELS[defaultSurface]} preview` : "Playlist preview"}
              </div>
              <div className="rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ borderColor: "var(--c-border)", color: "var(--c-muted)", background: "white" }}>
                {kind === "view" ? DISPLAY_CONTENT_LABELS[normalizedViewConfig.content] : `${previewSlides.length} slides`}
              </div>
            </div>

            <div className="mx-auto max-w-[270px]">
              {kind === "view" ? (
                <div className="overflow-hidden rounded-[20px] border border-rim bg-white shadow-[0_16px_32px_rgba(15,23,42,0.08)]">
                  <div className="relative h-[420px] overflow-hidden bg-white">
                    <iframe
                      className="absolute inset-0 border-0"
                      src={adHocPath}
                      style={{
                        height: `${100 / previewScale}%`,
                        pointerEvents: "none",
                        transform: `scale(${previewScale})`,
                        transformOrigin: "top left",
                        width: `${100 / previewScale}%`,
                      }}
                      title="Display preview"
                    />
                  </div>
                </div>
              ) : (
                <DisplayPlaylistPlayer className="h-[420px] min-h-0 rounded-[20px] border border-rim" slides={previewSlides} />
              )}
            </div>
          </div>
        </div>

        <div className="px-5 py-5 md:px-6 md:py-6">
          <SectionLabel title="Share & embed" />
          <p className="mt-2 text-[13px] leading-relaxed" style={{ color: "var(--c-muted)" }}>
            Use the ad hoc URL for quick experiments. Save the preset to generate stable reusable links.
          </p>

          <div className="mt-5 flex flex-col gap-4">
            {kind === "view" && (
              <>
                <DisplayLinkField label="Ad hoc URL" value={adHocUrl} />
                <DisplayLinkField copyLabel="Copy embed code" label="Embed iframe" multiline value={embedIframeSnippet} />
              </>
            )}

            {presetUrls ? (
              <>
                <DisplayLinkField label="Stable public URL" value={presetUrls.public} />
                <DisplayLinkField label="Stable embed URL" value={presetUrls.embed} />
                <DisplayLinkField label="Stable TV URL" value={presetUrls.tv} />
              </>
            ) : (
              <div className="rounded-[18px] border px-4 py-3 text-[12.5px] leading-relaxed" style={{ borderColor: "var(--c-border)", color: "var(--c-muted)", background: "rgba(255,255,255,0.76)" }}>
                Save this preset to generate stable `/display/[preset]` URLs across public, embed, and TV surfaces.
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

function EditorSection({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <section className="border-b px-5 py-5 md:px-6 md:py-6" style={SECTION_DIVIDER_STYLE}>
      <SectionLabel title={title} />
      {description && (
        <p className="mt-2 text-[13px] leading-relaxed" style={{ color: "var(--c-muted)" }}>
          {description}
        </p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SectionLabel({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--c-muted)" }}>
        {title}
      </div>
      <div className="h-px flex-1" style={{ background: "var(--c-border)" }} />
    </div>
  );
}

function StatusSegment({
  active,
  label,
}: {
  active?: boolean;
  label: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[12px] px-3 py-2 text-center text-[12px] font-semibold",
        active ? "shadow-[0_10px_20px_rgba(15,23,42,0.06)]" : "",
      )}
      style={{
        background: active ? "white" : "transparent",
        color: active ? "var(--c-text)" : "var(--c-muted)",
      }}
    >
      {label}
    </div>
  );
}

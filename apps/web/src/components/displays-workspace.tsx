"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import { Badge, Button, FieldHint, FieldLabel, Input, Select, Sheet, SheetContent, Tabs, Toggle, cn } from "@/components/ui";

import {
  getDraftDisplayContent,
  normalizeDisplayWorkspaceState,
  serializeDisplayWorkspaceState,
  type DisplayContentFilter,
  type DisplayPlaylistDrawerState,
  type DisplayViewDrawerState,
  type DisplayWorkspaceState,
} from "@/lib/display-admin";
import {
  DISPLAY_CONTENT_LABELS,
  DISPLAY_CONTENTS,
  DISPLAY_SURFACE_LABELS,
  buildAdHocDisplayPath,
  buildSavedDisplayPath,
  extractDisplayViewOptions,
  getCanonicalPublicDisplayPath,
  getDefaultDisplayViewConfig,
  getDefaultDisplayViewOptions,
  hydrateDisplayViewConfig,
  type DisplayContent,
  type DisplayDensity,
  type DisplayPlaylistConfig,
  type DisplayViewOptions,
  type SavedDisplaySurface,
} from "@/lib/displays";
import { slugify } from "@/lib/utils";
import type { DisplayPlaylistRecord } from "@/server/repositories/display-playlists";
import type { DisplayViewRecord } from "@/server/repositories/display-views";

import { DisplayLinkField } from "./display-link-field";
import { DisplayPlaylistPlayer } from "./display-playlist-player";

type ViewFormMode = "draft" | "empty" | "public" | "saved";
type PlaylistFormMode = "draft" | "empty" | "saved";

type ViewFormState = {
  content: DisplayContent;
  mode: ViewFormMode;
  name: string;
  options: DisplayViewOptions;
  slug: string;
  slugDirty: boolean;
  viewId: string | null;
};

type PlaylistFormState = {
  config: DisplayPlaylistConfig;
  mode: PlaylistFormMode;
  name: string;
  playlistId: string | null;
  slug: string;
  slugDirty: boolean;
};

const BOOLEAN_FIELDS: Array<{
  description: string;
  key: keyof Pick<
    ReturnType<typeof getDefaultDisplayViewConfig>,
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

const FILTERS: DisplayContentFilter[] = ["all", ...DISPLAY_CONTENTS];
const SAVED_SURFACE_TITLES: Record<SavedDisplaySurface, string> = {
  embed: "Embeds",
  tv: "TV Displays",
};

export function DisplaysWorkspace({
  appUrl,
  deletePlaylistAction,
  deleteViewAction,
  initialSearchParams,
  playlists,
  savePlaylistAction,
  saveViewAction,
  venueSlug,
  views,
}: {
  appUrl: string;
  deletePlaylistAction: (formData: FormData) => void | Promise<void>;
  deleteViewAction: (formData: FormData) => void | Promise<void>;
  initialSearchParams: Record<string, string | string[] | undefined>;
  playlists: DisplayPlaylistRecord[];
  savePlaylistAction: (formData: FormData) => void | Promise<void>;
  saveViewAction: (formData: FormData) => void | Promise<void>;
  venueSlug: string;
  views: DisplayViewRecord[];
}) {
  const pathname = `/app/${venueSlug}/displays`;
  const initialWorkspaceState = useMemo(
    () => normalizeDisplayWorkspaceState(initialSearchParams),
    [
      initialSearchParams.content,
      initialSearchParams.playlist,
      initialSearchParams.surface,
      initialSearchParams.tab,
      initialSearchParams.view,
    ],
  );
  const initialViewDrawer = initialWorkspaceState.drawer?.kind === "view" ? initialWorkspaceState.drawer : null;
  const initialPlaylistDrawer = initialWorkspaceState.drawer?.kind === "playlist" ? initialWorkspaceState.drawer : null;
  const publicViewsByContent = useMemo(
    () =>
      new Map(
        views
          .filter((view) => view.surface === "public")
          .map((view) => [view.content, view] as const),
      ),
    [views],
  );

  const [workspaceState, setWorkspaceState] = useState<DisplayWorkspaceState>(initialWorkspaceState);
  const [tvFilter, setTvFilter] = useState<DisplayContentFilter>("all");
  const [embedFilter, setEmbedFilter] = useState<DisplayContentFilter>("all");
  const [viewFormState, setViewFormState] = useState<ViewFormState>(() =>
    getInitialViewFormState({
      drawer: initialViewDrawer,
      publicView: initialViewDrawer?.mode === "public" ? publicViewsByContent.get(initialViewDrawer.content) ?? null : null,
      selectedView:
        initialViewDrawer?.mode === "saved"
          ? views.find((view) => view.id === initialViewDrawer.viewId && view.surface === initialViewDrawer.surface) ?? null
          : null,
    }),
  );
  const [playlistFormState, setPlaylistFormState] = useState<PlaylistFormState>(() =>
    getInitialPlaylistFormState(
      initialPlaylistDrawer?.mode === "saved"
        ? playlists.find(
            (playlist) =>
              playlist.id === initialPlaylistDrawer.playlistId && playlist.surface === initialPlaylistDrawer.surface,
          ) ?? null
        : null,
      initialPlaylistDrawer,
    ),
  );

  useEffect(() => {
    setWorkspaceState(initialWorkspaceState);
  }, [initialWorkspaceState]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const query = serializeDisplayWorkspaceState(workspaceState);
    const nextUrl = query ? `${pathname}?${query}` : pathname;
    window.history.replaceState(null, "", nextUrl);
  }, [pathname, workspaceState]);

  useEffect(() => {
    if (typeof window === "undefined" || !workspaceState.drawer) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setWorkspaceState((current) => ({ ...current, drawer: null }));
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [workspaceState.drawer]);

  const drawerView = workspaceState.drawer?.kind === "view" ? workspaceState.drawer : null;
  const drawerPlaylist = workspaceState.drawer?.kind === "playlist" ? workspaceState.drawer : null;
  const publicDrawerView = drawerView?.mode === "public" ? publicViewsByContent.get(drawerView.content) ?? null : null;
  const selectedSavedView =
    drawerView?.mode === "saved"
      ? views.find((view) => view.id === drawerView.viewId && view.surface === drawerView.surface) ?? null
      : null;
  const selectedSavedPlaylist =
    drawerPlaylist?.mode === "saved"
      ? playlists.find(
          (playlist) =>
            playlist.id === drawerPlaylist.playlistId && playlist.surface === drawerPlaylist.surface,
        ) ?? null
      : null;

  useEffect(() => {
    setViewFormState(
      getInitialViewFormState({
        drawer: drawerView,
        publicView: publicDrawerView,
        selectedView: selectedSavedView,
      }),
    );
  }, [drawerView, publicDrawerView, selectedSavedView]);

  useEffect(() => {
    setPlaylistFormState(getInitialPlaylistFormState(selectedSavedPlaylist, drawerPlaylist));
  }, [drawerPlaylist, selectedSavedPlaylist]);

  const tvViews = useMemo(() => views.filter((view) => view.surface === "tv"), [views]);
  const embedViews = useMemo(() => views.filter((view) => view.surface === "embed"), [views]);
  const filteredTvViews = useMemo(() => filterSavedViews(tvViews, tvFilter), [tvFilter, tvViews]);
  const filteredEmbedViews = useMemo(() => filterSavedViews(embedViews, embedFilter), [embedFilter, embedViews]);
  const playlistSurfaceViews = useMemo(
    () =>
      views.filter(
        (view) => view.surface === (drawerPlaylist?.surface ?? "tv") && Boolean(view.slug),
      ),
    [drawerPlaylist?.surface, views],
  );

  const currentViewSurface = drawerView?.surface ?? "public";
  const normalizedViewConfig = useMemo(
    () => hydrateDisplayViewConfig(viewFormState.options, viewFormState.content, currentViewSurface),
    [currentViewSurface, viewFormState.content, viewFormState.options],
  );
  const currentViewPreviewPath = useMemo(
    () => buildAdHocDisplayPath(venueSlug, normalizedViewConfig),
    [normalizedViewConfig, venueSlug],
  );
  const currentViewPreviewUrl = `${appUrl}${currentViewPreviewPath}`;
  const currentPublicUrl = `${appUrl}${getCanonicalPublicDisplayPath(venueSlug, viewFormState.content)}`;
  const currentSavedViewUrl =
    drawerView && drawerView.surface !== "public" && viewFormState.mode === "saved" && viewFormState.slug
      ? `${appUrl}${buildSavedDisplayPath(venueSlug, viewFormState.slug, drawerView.surface)}`
      : null;
  const currentSavedPlaylistUrl =
    drawerPlaylist && playlistFormState.mode === "saved" && playlistFormState.slug
      ? `${appUrl}${buildSavedDisplayPath(venueSlug, playlistFormState.slug, drawerPlaylist.surface)}`
      : null;
  const playlistPreviewSlides = useMemo(() => {
    const viewById = new Map(playlistSurfaceViews.map((view) => [view.id, view]));

    return playlistFormState.config.slides
      .map((slide) => {
        const referencedView = viewById.get(slide.viewId);

        if (!referencedView?.slug) {
          return null;
        }

        return {
          durationSeconds: slide.durationSeconds,
          src: buildSavedDisplayPath(venueSlug, referencedView.slug, drawerPlaylist?.surface ?? "tv"),
          title: referencedView.name ?? DISPLAY_CONTENT_LABELS[referencedView.content],
        };
      })
      .filter((slide): slide is NonNullable<typeof slide> => Boolean(slide));
  }, [drawerPlaylist?.surface, playlistFormState.config.slides, playlistSurfaceViews, venueSlug]);

  const tvContentCounts = useMemo(() => countViewsByContent(tvViews), [tvViews]);
  const embedContentCounts = useMemo(() => countViewsByContent(embedViews), [embedViews]);

  function closeDrawer() {
    setWorkspaceState((current) => ({ ...current, drawer: null }));
  }

  function handleTopTabChange(nextTab: string) {
    setWorkspaceState({
      drawer: null,
      tab: nextTab === "playlists" ? "playlists" : "views",
    });
  }

  function openPublicView(content: DisplayContent) {
    setWorkspaceState({
      drawer: {
        content,
        kind: "view",
        mode: "public",
        surface: "public",
        viewId: null,
      },
      tab: "views",
    });
  }

  function openDraftView(surface: SavedDisplaySurface) {
    const filter = surface === "tv" ? tvFilter : embedFilter;

    setWorkspaceState({
      drawer: {
        content: getDraftDisplayContent(filter),
        kind: "view",
        mode: "draft",
        surface,
        viewId: null,
      },
      tab: "views",
    });
  }

  function openSavedView(view: DisplayViewRecord) {
    setWorkspaceState({
      drawer: {
        content: view.content,
        kind: "view",
        mode: "saved",
        surface: view.surface as SavedDisplaySurface,
        viewId: view.id,
      },
      tab: "views",
    });
  }

  function openDraftPlaylist(surface: SavedDisplaySurface) {
    setWorkspaceState({
      drawer: {
        kind: "playlist",
        mode: "draft",
        playlistId: null,
        surface,
      },
      tab: "playlists",
    });
  }

  function openSavedPlaylist(playlist: DisplayPlaylistRecord) {
    setWorkspaceState({
      drawer: {
        kind: "playlist",
        mode: "saved",
        playlistId: playlist.id,
        surface: playlist.surface,
      },
      tab: "playlists",
    });
  }

  return (
    <>
      <section
        className="overflow-hidden rounded-[28px] border shadow-panel"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.98), color-mix(in srgb, var(--c-bg2) 74%, white))",
          borderColor: "var(--c-border)",
        }}
      >
        <div className="border-b px-5 py-5 md:px-6 md:py-6" style={{ borderColor: "var(--c-border)" }}>
          <Tabs
            active={workspaceState.tab}
            className="mb-0 border-b-0"
            onChange={handleTopTabChange}
            tabs={[
              { id: "views", label: "Views" },
              { id: "playlists", label: "Playlists" },
            ]}
          />
        </div>

        <div className="space-y-5 px-5 py-5 md:px-6 md:py-6">
          {workspaceState.tab === "views" ? (
            <>
              <PresetSection
                description="The single canonical public view for each page type. Save custom settings once and they apply anywhere that public page is shared."
                title="Public"
              >
                <ListFrame>
                  {DISPLAY_CONTENTS.map((content, index) => {
                    const publicView = publicViewsByContent.get(content) ?? null;

                    return (
                      <PresetRow
                        active={drawerView?.mode === "public" && drawerView.content === content}
                        badges={<Badge variant="accent">Canonical</Badge>}
                        description={
                          publicView
                            ? "Saved public settings are currently applied to this page."
                            : "Using defaults until you save custom settings."
                        }
                        isLast={index === DISPLAY_CONTENTS.length - 1}
                        key={content}
                        meta={getCanonicalPublicDisplayPath(venueSlug, content)}
                        onClick={() => openPublicView(content)}
                        title={DISPLAY_CONTENT_LABELS[content]}
                      />
                    );
                  })}
                </ListFrame>
              </PresetSection>

              <PresetSection
                actionLabel="+ New display"
                description="Named presets optimized for TVs and signage screens. Each one gets a stable display URL."
                onAction={() => openDraftView("tv")}
                title="TV Displays"
              >
                <FilterPillBar
                  activeFilter={tvFilter}
                  counts={tvContentCounts}
                  onChange={setTvFilter}
                />
                <ListFrame className="mt-4">
                  {filteredTvViews.length === 0 ? (
                    <ListEmptyState body={getEmptySavedViewLabel("tv", tvFilter)} />
                  ) : (
                    filteredTvViews.map((view, index) => (
                      <PresetRow
                        active={drawerView?.mode === "saved" && drawerView.viewId === view.id}
                        badges={
                          <>
                            <Badge variant="info">{DISPLAY_CONTENT_LABELS[view.content]}</Badge>
                            <Badge variant="success">Saved</Badge>
                          </>
                        }
                        description={`${formatAspect(view.options.aspect)} · ${formatDensity(view.options.density)}`}
                        isLast={index === filteredTvViews.length - 1 && drawerView?.mode !== "draft"}
                        key={view.id}
                        meta={buildSavedDisplayPath(venueSlug, view.slug ?? "", "tv")}
                        onClick={() => openSavedView(view)}
                        title={view.name ?? "Untitled display"}
                      />
                    ))
                  )}
                  {drawerView?.mode === "draft" && drawerView.surface === "tv" && (
                    <DraftRow
                      content={drawerView.content}
                      label="Draft display"
                    />
                  )}
                </ListFrame>
              </PresetSection>

              <PresetSection
                actionLabel="+ New embed"
                description="Configured views you can drop into any website via iframe. Each embed gets its own stable URL and embed code."
                onAction={() => openDraftView("embed")}
                title="Embeds"
              >
                <FilterPillBar
                  activeFilter={embedFilter}
                  counts={embedContentCounts}
                  onChange={setEmbedFilter}
                />
                <ListFrame className="mt-4">
                  {filteredEmbedViews.length === 0 ? (
                    <ListEmptyState body={getEmptySavedViewLabel("embed", embedFilter)} />
                  ) : (
                    filteredEmbedViews.map((view, index) => (
                      <PresetRow
                        active={drawerView?.mode === "saved" && drawerView.viewId === view.id}
                        badges={
                          <>
                            <Badge variant="info">{DISPLAY_CONTENT_LABELS[view.content]}</Badge>
                            <Badge variant="success">Saved</Badge>
                          </>
                        }
                        description={`${formatAspect(view.options.aspect)} · ${formatDensity(view.options.density)}`}
                        isLast={index === filteredEmbedViews.length - 1 && drawerView?.mode !== "draft"}
                        key={view.id}
                        meta={buildSavedDisplayPath(venueSlug, view.slug ?? "", "embed")}
                        onClick={() => openSavedView(view)}
                        title={view.name ?? "Untitled embed"}
                      />
                    ))
                  )}
                  {drawerView?.mode === "draft" && drawerView.surface === "embed" && (
                    <DraftRow
                      content={drawerView.content}
                      label="Draft embed"
                    />
                  )}
                </ListFrame>
              </PresetSection>
            </>
          ) : (
            <>
              <PresetSection
                actionLabel="+ New playlist"
                description="Rotate saved TV display presets into a single loop you can run on larger screens."
                onAction={() => openDraftPlaylist("tv")}
                title="TV Playlists"
              >
                <ListFrame>
                  {playlists.filter((playlist) => playlist.surface === "tv").length === 0 ? (
                    <ListEmptyState body="No TV playlists yet." />
                  ) : (
                    playlists
                      .filter((playlist) => playlist.surface === "tv")
                      .map((playlist, index, rows) => (
                        <PresetRow
                          active={drawerPlaylist?.mode === "saved" && drawerPlaylist.playlistId === playlist.id}
                          badges={
                            <>
                              <Badge variant="info">{formatSlideCount(playlist.config.slides.length)}</Badge>
                              <Badge variant="success">Saved</Badge>
                            </>
                          }
                          description={`${formatSlideCount(playlist.config.slides.length)} in this rotation.`}
                          isLast={index === rows.length - 1 && drawerPlaylist?.surface !== "tv"}
                          key={playlist.id}
                          meta={buildSavedDisplayPath(venueSlug, playlist.slug, "tv")}
                          onClick={() => openSavedPlaylist(playlist)}
                          title={playlist.name}
                        />
                      ))
                  )}
                  {drawerPlaylist?.mode === "draft" && drawerPlaylist.surface === "tv" && (
                    <DraftRow label="Draft playlist" />
                  )}
                </ListFrame>
              </PresetSection>

              <PresetSection
                actionLabel="+ New playlist"
                description="Rotate saved embed presets with one shared playlist URL for websites or kiosks."
                onAction={() => openDraftPlaylist("embed")}
                title="Embed Playlists"
              >
                <ListFrame>
                  {playlists.filter((playlist) => playlist.surface === "embed").length === 0 ? (
                    <ListEmptyState body="No embed playlists yet." />
                  ) : (
                    playlists
                      .filter((playlist) => playlist.surface === "embed")
                      .map((playlist, index, rows) => (
                        <PresetRow
                          active={drawerPlaylist?.mode === "saved" && drawerPlaylist.playlistId === playlist.id}
                          badges={
                            <>
                              <Badge variant="info">{formatSlideCount(playlist.config.slides.length)}</Badge>
                              <Badge variant="success">Saved</Badge>
                            </>
                          }
                          description={`${formatSlideCount(playlist.config.slides.length)} in this rotation.`}
                          isLast={index === rows.length - 1 && drawerPlaylist?.surface !== "embed"}
                          key={playlist.id}
                          meta={buildSavedDisplayPath(venueSlug, playlist.slug, "embed")}
                          onClick={() => openSavedPlaylist(playlist)}
                          title={playlist.name}
                        />
                      ))
                  )}
                  {drawerPlaylist?.mode === "draft" && drawerPlaylist.surface === "embed" && (
                    <DraftRow label="Draft playlist" />
                  )}
                </ListFrame>
              </PresetSection>
            </>
          )}
        </div>
      </section>

      {workspaceState.drawer && (
        <DisplayAdminDrawer
          badges={
            workspaceState.drawer.kind === "view"
              ? renderViewDrawerBadges(drawerView, viewFormState.content)
              : renderPlaylistDrawerBadges(drawerPlaylist)
          }
          onClose={closeDrawer}
          preview={
            workspaceState.drawer.kind === "view"
              ? renderViewPreview({
                  currentPublicUrl,
                  currentSavedViewUrl,
                  previewPath: currentViewPreviewPath,
                  previewUrl: currentViewPreviewUrl,
                  surface: currentViewSurface,
                  viewFormState,
                })
              : renderPlaylistPreview({
                  playlistPreviewSlides,
                  savedPlaylistUrl: currentSavedPlaylistUrl,
                  surface: drawerPlaylist?.surface ?? "tv",
                })
          }
          title={
            workspaceState.drawer.kind === "view"
              ? getViewDrawerTitle(drawerView)
              : getPlaylistDrawerTitle(drawerPlaylist)
          }
        >
          {workspaceState.drawer.kind === "view" ? (
            drawerView?.mode === "public" ? (
              <form action={saveViewAction} className="flex h-full flex-col">
                <input name="content" type="hidden" value={viewFormState.content} />
                <input name="surface" type="hidden" value="public" />
                <input name="view_id" type="hidden" value={viewFormState.viewId ?? ""} />
                <input
                  name="config_json"
                  type="hidden"
                  value={JSON.stringify(extractDisplayViewOptions(normalizedViewConfig))}
                />

                <EditorSection title="Public view">
                  <p className="text-[13px] leading-relaxed" style={{ color: "var(--c-muted)" }}>
                    This is the single canonical public configuration for the{" "}
                    {DISPLAY_CONTENT_LABELS[viewFormState.content].toLowerCase()} page.
                  </p>
                </EditorSection>

                <ViewSettingsFields
                  content={viewFormState.content}
                  options={viewFormState.options}
                  setOptions={(updater) =>
                    setViewFormState((current) => ({ ...current, options: updater(current.options) }))
                  }
                  surface="public"
                />
                <ViewToggleFields
                  content={viewFormState.content}
                  options={viewFormState.options}
                  setOptions={(updater) =>
                    setViewFormState((current) => ({ ...current, options: updater(current.options) }))
                  }
                  surface="public"
                />

                <EditorFooter submitLabel="Save public view" />
              </form>
            ) : (
              <form action={saveViewAction} className="flex h-full flex-col">
                <input name="content" type="hidden" value={viewFormState.content} />
                <input name="surface" type="hidden" value={drawerView?.surface ?? "tv"} />
                <input name="view_id" type="hidden" value={viewFormState.viewId ?? ""} />
                <input
                  name="config_json"
                  type="hidden"
                  value={JSON.stringify(extractDisplayViewOptions(normalizedViewConfig))}
                />

                <EditorSection title="Identity">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="flex flex-col gap-1 md:col-span-1">
                      <FieldLabel htmlFor="display-name" required>Name</FieldLabel>
                      <Input
                        className="bg-white"
                        id="display-name"
                        name="name"
                        onChange={(event) =>
                          setViewFormState((current) => ({
                            ...current,
                            name: event.target.value,
                            slug: current.slugDirty ? current.slug : slugify(event.target.value),
                          }))
                        }
                        placeholder={drawerView?.surface === "tv" ? "Main taproom TV" : "Homepage embed"}
                        required
                        value={viewFormState.name}
                      />
                      <FieldHint>Use a clear name your team will recognize when sharing or sequencing displays.</FieldHint>
                    </div>

                    <div className="flex flex-col gap-1 md:col-span-1">
                      <FieldLabel htmlFor="display-slug" required>Slug</FieldLabel>
                      <Input
                        className="bg-white"
                        id="display-slug"
                        name="slug"
                        onChange={(event) =>
                          setViewFormState((current) => ({
                            ...current,
                            slug: slugify(event.target.value),
                            slugDirty: true,
                          }))
                        }
                        placeholder={drawerView?.surface === "tv" ? "main-taproom-tv" : "homepage-events"}
                        required
                        value={viewFormState.slug}
                      />
                      <FieldHint>The slug becomes part of the stable saved display URL.</FieldHint>
                    </div>

                    <div className="flex flex-col gap-1 md:col-span-1">
                      <FieldLabel htmlFor="display-content">Content</FieldLabel>
                      <Select
                        className="bg-white"
                        id="display-content"
                        name="content_select"
                        onChange={(event) =>
                          setViewFormState((current) => ({
                            ...current,
                            content: event.target.value as DisplayContent,
                            options: getDefaultDisplayViewOptions(
                              drawerView?.surface ?? "tv",
                              event.target.value as DisplayContent,
                            ),
                          }))
                        }
                        value={viewFormState.content}
                      >
                        {DISPLAY_CONTENTS.map((content) => (
                          <option key={content} value={content}>
                            {DISPLAY_CONTENT_LABELS[content]}
                          </option>
                        ))}
                      </Select>
                      <FieldHint>Set which public page this saved preset should display.</FieldHint>
                    </div>
                  </div>
                </EditorSection>

                <ViewSettingsFields
                  content={viewFormState.content}
                  options={viewFormState.options}
                  setOptions={(updater) =>
                    setViewFormState((current) => ({ ...current, options: updater(current.options) }))
                  }
                  surface={drawerView?.surface ?? "tv"}
                />
                <ViewToggleFields
                  content={viewFormState.content}
                  options={viewFormState.options}
                  setOptions={(updater) =>
                    setViewFormState((current) => ({ ...current, options: updater(current.options) }))
                  }
                  surface={drawerView?.surface ?? "tv"}
                />

                <EditorFooter
                  deleteAction={viewFormState.mode === "saved" ? deleteViewAction : undefined}
                  deleteLabel={drawerView?.surface === "embed" ? "Delete embed" : "Delete display"}
                  submitLabel={getViewSubmitLabel(drawerView?.surface ?? "tv", viewFormState.mode)}
                />
              </form>
            )
          ) : (
            <form action={savePlaylistAction} className="flex h-full flex-col">
              <input name="playlist_id" type="hidden" value={playlistFormState.playlistId ?? ""} />
              <input name="surface" type="hidden" value={drawerPlaylist?.surface ?? "tv"} />
              <input name="config_json" type="hidden" value={JSON.stringify(playlistFormState.config)} />

              <EditorSection title="Identity">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <FieldLabel htmlFor="playlist-name" required>Name</FieldLabel>
                    <Input
                      className="bg-white"
                      id="playlist-name"
                      name="name"
                      onChange={(event) =>
                        setPlaylistFormState((current) => ({
                          ...current,
                          name: event.target.value,
                          slug: current.slugDirty ? current.slug : slugify(event.target.value),
                        }))
                      }
                      placeholder="Weekend rotation"
                      required
                      value={playlistFormState.name}
                    />
                    <FieldHint>Use a clear internal name for the rotation your team will load.</FieldHint>
                  </div>

                  <div className="flex flex-col gap-1">
                    <FieldLabel htmlFor="playlist-slug" required>Slug</FieldLabel>
                    <Input
                      className="bg-white"
                      id="playlist-slug"
                      name="slug"
                      onChange={(event) =>
                        setPlaylistFormState((current) => ({
                          ...current,
                          slug: slugify(event.target.value),
                          slugDirty: true,
                        }))
                      }
                      placeholder="weekend-rotation"
                      required
                      value={playlistFormState.slug}
                    />
                    <FieldHint>The slug becomes part of the stable playlist URL for this surface.</FieldHint>
                  </div>
                </div>
              </EditorSection>

              <EditorSection
                description={
                  playlistSurfaceViews.length === 0
                    ? `Create at least one ${DISPLAY_SURFACE_LABELS[drawerPlaylist?.surface ?? "tv"].toLowerCase()} view before building a playlist.`
                    : undefined
                }
                title="Slides"
              >
                <div className="flex flex-col gap-3">
                  {playlistFormState.config.slides.length === 0 ? (
                    <div
                      className="rounded-[18px] border border-dashed border-rim px-4 py-5 text-[13px] leading-relaxed"
                      style={{ color: "var(--c-muted)", background: "rgba(255,255,255,0.72)" }}
                    >
                      Add saved views to build the playlist rotation.
                    </div>
                  ) : (
                    playlistFormState.config.slides.map((slide, index) => (
                      <div
                        className="grid gap-3 rounded-[18px] border p-4 md:grid-cols-[1.8fr_0.8fr_auto]"
                        key={`${slide.viewId}-${index}`}
                        style={{ borderColor: "var(--c-border)", background: "rgba(255,255,255,0.78)" }}
                      >
                        <div className="flex flex-col gap-1">
                          <FieldLabel htmlFor={`playlist-view-${index}`}>Display view</FieldLabel>
                          <Select
                            className="bg-white"
                            id={`playlist-view-${index}`}
                            onChange={(event) =>
                              setPlaylistFormState((current) => ({
                                ...current,
                                config: {
                                  ...current.config,
                                  slides: current.config.slides.map((entry, slideIndex) =>
                                    slideIndex === index
                                      ? { ...entry, viewId: event.target.value }
                                      : entry,
                                  ),
                                },
                              }))
                            }
                            value={slide.viewId}
                          >
                            {playlistSurfaceViews.length === 0 ? (
                              <option value="">No matching display views yet</option>
                            ) : (
                              playlistSurfaceViews.map((view) => (
                                <option key={view.id} value={view.id}>
                                  {view.name} · {DISPLAY_CONTENT_LABELS[view.content]}
                                </option>
                              ))
                            )}
                          </Select>
                        </div>

                        <div className="flex flex-col gap-1">
                          <FieldLabel htmlFor={`playlist-duration-${index}`}>Seconds</FieldLabel>
                          <Input
                            className="bg-white"
                            id={`playlist-duration-${index}`}
                            min={3}
                            onChange={(event) =>
                              setPlaylistFormState((current) => ({
                                ...current,
                                config: {
                                  ...current.config,
                                  slides: current.config.slides.map((entry, slideIndex) =>
                                    slideIndex === index
                                      ? { ...entry, durationSeconds: Number(event.target.value || 12) }
                                      : entry,
                                  ),
                                },
                              }))
                            }
                            type="number"
                            value={slide.durationSeconds}
                          />
                        </div>

                        <div className="flex items-end">
                          <Button
                            onClick={() =>
                              setPlaylistFormState((current) => ({
                                ...current,
                                config: {
                                  ...current.config,
                                  slides: current.config.slides.filter((_, slideIndex) => slideIndex !== index),
                                },
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
                      disabled={playlistSurfaceViews.length === 0}
                      onClick={() =>
                        setPlaylistFormState((current) => ({
                          ...current,
                          config: {
                            ...current.config,
                            slides: [
                              ...current.config.slides,
                              {
                                durationSeconds: 12,
                                transition: "fade",
                                viewId: playlistSurfaceViews[0]?.id ?? "",
                              },
                            ],
                          },
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

              <EditorFooter
                deleteAction={playlistFormState.mode === "saved" ? deletePlaylistAction : undefined}
                deleteLabel="Delete playlist"
                submitLabel={playlistFormState.mode === "draft" ? "Create playlist" : "Save playlist"}
              />
            </form>
          )}
        </DisplayAdminDrawer>
      )}
    </>
  );
}

function getInitialViewFormState({
  drawer,
  publicView,
  selectedView,
}: {
  drawer: DisplayViewDrawerState | null;
  publicView: DisplayViewRecord | null;
  selectedView: DisplayViewRecord | null;
}): ViewFormState {
  if (!drawer) {
    return {
      content: "menu",
      mode: "empty",
      name: "",
      options: getDefaultDisplayViewOptions("public", "menu"),
      slug: "",
      slugDirty: false,
      viewId: null,
    };
  }

  if (drawer.mode === "public") {
    return {
      content: drawer.content,
      mode: "public",
      name: "",
      options: publicView?.options ?? getDefaultDisplayViewOptions("public", drawer.content),
      slug: "",
      slugDirty: false,
      viewId: publicView?.id ?? null,
    };
  }

  if (drawer.mode === "draft") {
    return {
      content: drawer.content,
      mode: "draft",
      name: "",
      options: getDefaultDisplayViewOptions(drawer.surface, drawer.content),
      slug: "",
      slugDirty: false,
      viewId: null,
    };
  }

  if (selectedView) {
    return {
      content: selectedView.content,
      mode: "saved",
      name: selectedView.name ?? "",
      options: selectedView.options,
      slug: selectedView.slug ?? "",
      slugDirty: Boolean(selectedView.slug),
      viewId: selectedView.id,
    };
  }

  return {
    content: drawer.content,
    mode: "empty",
    name: "",
    options: getDefaultDisplayViewOptions(drawer.surface, drawer.content),
    slug: "",
    slugDirty: false,
    viewId: null,
  };
}

function getInitialPlaylistFormState(
  selectedPlaylist: DisplayPlaylistRecord | null,
  drawer: DisplayPlaylistDrawerState | null,
): PlaylistFormState {
  if (!drawer) {
    return {
      config: { slides: [] },
      mode: "empty",
      name: "",
      playlistId: null,
      slug: "",
      slugDirty: false,
    };
  }

  if (drawer.mode === "draft") {
    return {
      config: { slides: [] },
      mode: "draft",
      name: "",
      playlistId: null,
      slug: "",
      slugDirty: false,
    };
  }

  if (selectedPlaylist) {
    return {
      config: selectedPlaylist.config,
      mode: "saved",
      name: selectedPlaylist.name,
      playlistId: selectedPlaylist.id,
      slug: selectedPlaylist.slug,
      slugDirty: true,
    };
  }

  return {
    config: { slides: [] },
    mode: "empty",
    name: "",
    playlistId: null,
    slug: "",
    slugDirty: false,
  };
}

function filterSavedViews(views: DisplayViewRecord[], filter: DisplayContentFilter) {
  return filter === "all" ? views : views.filter((view) => view.content === filter);
}

function countViewsByContent(views: DisplayViewRecord[]) {
  return DISPLAY_CONTENTS.reduce(
    (counts, content) => ({
      ...counts,
      [content]: views.filter((view) => view.content === content).length,
    }),
    {} as Record<DisplayContent, number>,
  );
}

function formatAspect(aspect: DisplayViewOptions["aspect"]) {
  switch (aspect) {
    case "landscape":
      return "Landscape";
    case "portrait":
      return "Portrait";
    default:
      return "Auto";
  }
}

function formatDensity(density: DisplayDensity) {
  return density === "compact" ? "Compact" : "Comfortable";
}

function formatSlideCount(slideCount: number) {
  return slideCount === 1 ? "1 slide" : `${slideCount} slides`;
}

function getFilterLabel(filter: DisplayContentFilter) {
  return filter === "all" ? "All" : DISPLAY_CONTENT_LABELS[filter];
}

function getEmptySavedViewLabel(surface: SavedDisplaySurface, filter: DisplayContentFilter) {
  if (filter === "all") {
    return surface === "tv" ? "No TV displays yet." : "No embeds yet.";
  }

  return `No ${DISPLAY_CONTENT_LABELS[filter].toLowerCase()} ${surface === "tv" ? "displays" : "embeds"} yet.`;
}

function getViewDrawerTitle(drawer: DisplayViewDrawerState | null) {
  if (!drawer) {
    return "Display";
  }

  if (drawer.mode === "public") {
    return `Edit ${DISPLAY_CONTENT_LABELS[drawer.content]} public view`;
  }

  if (drawer.mode === "draft") {
    return drawer.surface === "embed" ? "New embed" : "New display";
  }

  return drawer.surface === "embed" ? "Edit embed" : "Edit display";
}

function getPlaylistDrawerTitle(drawer: DisplayPlaylistDrawerState | null) {
  if (!drawer) {
    return "Playlist";
  }

  return drawer.mode === "draft" ? "New playlist" : "Edit playlist";
}

function getViewSubmitLabel(surface: SavedDisplaySurface, mode: ViewFormMode) {
  if (mode === "draft") {
    return surface === "embed" ? "Create embed" : "Create display";
  }

  return surface === "embed" ? "Save embed" : "Save display";
}

function renderViewDrawerBadges(drawer: DisplayViewDrawerState | null, content: DisplayContent) {
  if (!drawer) {
    return null;
  }

  return (
    <>
      <Badge variant={drawer.mode === "draft" ? "warning" : drawer.mode === "saved" ? "success" : "accent"}>
        {drawer.mode === "draft" ? "Draft" : drawer.mode === "saved" ? "Saved" : "Canonical"}
      </Badge>
      <Badge variant="info">{drawer.surface === "public" ? "Public" : SAVED_SURFACE_TITLES[drawer.surface]}</Badge>
      <Badge>{DISPLAY_CONTENT_LABELS[content]}</Badge>
    </>
  );
}

function renderPlaylistDrawerBadges(drawer: DisplayPlaylistDrawerState | null) {
  if (!drawer) {
    return null;
  }

  return (
    <>
      <Badge variant={drawer.mode === "draft" ? "warning" : "success"}>
        {drawer.mode === "draft" ? "Draft" : "Saved"}
      </Badge>
      <Badge variant="info">{SAVED_SURFACE_TITLES[drawer.surface]}</Badge>
    </>
  );
}

function PresetSection({
  actionLabel,
  children,
  description,
  onAction,
  title,
}: {
  actionLabel?: string;
  children: ReactNode;
  description: string;
  onAction?: () => void;
  title: string;
}) {
  return (
    <section
      className="rounded-[24px] border p-4 md:p-5"
      style={{ borderColor: "var(--c-border)", background: "rgba(255,255,255,0.8)" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[15px] font-semibold" style={{ color: "var(--c-text)" }}>
            {title}
          </div>
          <p className="mt-2 max-w-[760px] text-[13px] leading-relaxed" style={{ color: "var(--c-muted)" }}>
            {description}
          </p>
        </div>
        {actionLabel && onAction && (
          <Button onClick={onAction} size="sm" type="button" variant="secondary">
            {actionLabel}
          </Button>
        )}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function FilterPillBar({
  activeFilter,
  counts,
  onChange,
}: {
  activeFilter: DisplayContentFilter;
  counts: Record<DisplayContent, number>;
  onChange: (filter: DisplayContentFilter) => void;
}) {
  const totalCount = Object.values(counts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map((filter) => {
        const count = filter === "all" ? totalCount : counts[filter];

        return (
          <button
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors",
              activeFilter === filter
                ? "border-ember bg-ember/10 text-ember"
                : "border-rim bg-white text-[var(--c-text)] hover:border-ember/50",
            )}
            key={filter}
            onClick={() => onChange(filter)}
            type="button"
          >
            <span>{getFilterLabel(filter)}</span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0 text-[10px] font-semibold",
                activeFilter === filter ? "bg-ember-light text-ember-dark" : "bg-[var(--c-bg2)] text-[var(--c-muted)]",
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ListFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("overflow-hidden rounded-[18px] border", className)}
      style={{ borderColor: "var(--c-border)", background: "rgba(255,255,255,0.72)" }}
    >
      {children}
    </div>
  );
}

function PresetRow({
  active,
  badges,
  description,
  isLast,
  meta,
  onClick,
  title,
}: {
  active?: boolean;
  badges?: ReactNode;
  description?: string;
  isLast?: boolean;
  meta: string;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      className={cn(
        "w-full px-4 py-4 text-left transition-colors",
        !isLast && "border-b",
        active ? "bg-ember/5" : "bg-transparent hover:bg-[rgba(255,255,255,0.86)]",
      )}
      onClick={onClick}
      style={{ borderColor: "var(--c-border)" }}
      type="button"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold" style={{ color: "var(--c-text)" }}>
            {title}
          </div>
          <div className="mt-1 font-mono text-[11.5px]" style={{ color: "var(--c-muted)" }}>
            {meta}
          </div>
          {description && (
            <div className="mt-2 text-[12.5px]" style={{ color: "var(--c-muted)" }}>
              {description}
            </div>
          )}
        </div>
        {badges && <div className="flex shrink-0 flex-wrap justify-end gap-2">{badges}</div>}
      </div>
    </button>
  );
}

function DraftRow({
  content,
  label,
}: {
  content?: DisplayContent;
  label: string;
}) {
  return (
    <div
      className="border-t border-dashed px-4 py-4"
      style={{ borderColor: "var(--accent)", background: "rgba(255,255,255,0.86)" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[14px] font-semibold" style={{ color: "var(--accent)" }}>
            {label}
          </div>
          <div className="mt-2 text-[12.5px]" style={{ color: "var(--c-muted)" }}>
            Fill out the drawer to save a stable preset.
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {content && <Badge>{DISPLAY_CONTENT_LABELS[content]}</Badge>}
          <Badge variant="warning">Draft</Badge>
        </div>
      </div>
    </div>
  );
}

function ListEmptyState({ body }: { body: string }) {
  return (
    <div className="px-4 py-5 text-[13px] leading-relaxed" style={{ color: "var(--c-muted)" }}>
      {body}
    </div>
  );
}

function DisplayAdminDrawer({
  badges,
  children,
  onClose,
  preview,
  title,
}: {
  badges?: ReactNode;
  children: ReactNode;
  onClose: () => void;
  preview: ReactNode;
  title: string;
}) {
  return (
    <Sheet onOpenChange={(nextOpen) => !nextOpen && onClose()} open>
      <SheetContent
        aria-label={title}
        className="w-full overflow-hidden border-l-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(247,244,240,0.99))] p-0 sm:max-w-[min(100vw,1140px)]"
        hideClose
        side="right"
      >
        <div className="border-b px-5 py-4 md:px-6" style={{ borderColor: "var(--c-border)" }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[18px] font-semibold tracking-[-0.02em]" style={{ color: "var(--c-text)" }}>
                {title}
              </div>
              {badges && <div className="mt-3 flex flex-wrap gap-2">{badges}</div>}
            </div>
            <Button onClick={onClose} size="sm" type="button" variant="secondary">
              Close
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 lg:flex">
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          <aside
            className="min-h-0 w-full shrink-0 overflow-y-auto border-t lg:w-[420px] lg:border-l lg:border-t-0 xl:w-[460px]"
            style={{
              background: "linear-gradient(180deg, rgba(250,247,243,0.96), rgba(255,255,255,0.98))",
              borderColor: "var(--c-border)",
            }}
          >
            {preview}
          </aside>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ViewSettingsFields({
  content,
  options,
  setOptions,
  surface,
}: {
  content: DisplayContent;
  options: DisplayViewOptions;
  setOptions: (updater: (current: DisplayViewOptions) => DisplayViewOptions) => void;
  surface: DisplayViewDrawerState["surface"];
}) {
  return (
    <EditorSection title="Display settings">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex flex-col gap-1">
          <FieldLabel htmlFor="display-density">Density</FieldLabel>
          <Select
            className="bg-white"
            id="display-density"
            onChange={(event) =>
              setOptions((current) => ({ ...current, density: event.target.value as DisplayViewOptions["density"] }))
            }
            value={options.density}
          >
            <option value="comfortable">Comfortable</option>
            <option value="compact">Compact</option>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <FieldLabel htmlFor="display-aspect">Aspect</FieldLabel>
          <Select
            className="bg-white"
            id="display-aspect"
            onChange={(event) =>
              setOptions((current) => ({ ...current, aspect: event.target.value as DisplayViewOptions["aspect"] }))
            }
            value={options.aspect}
          >
            <option value="auto">Auto</option>
            <option value="landscape">Landscape</option>
            <option value="portrait">Portrait</option>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <FieldLabel htmlFor="display-link-target">Link target</FieldLabel>
          <Select
            className="bg-white"
            id="display-link-target"
            onChange={(event) =>
              setOptions((current) => ({
                ...current,
                linkTarget: event.target.value as DisplayViewOptions["linkTarget"],
              }))
            }
            value={options.linkTarget}
          >
            <option value="same-tab">Same tab</option>
            <option value="new-tab">New tab</option>
          </Select>
          <FieldHint>
            {surface === "embed"
              ? "Embed presets keep the host page open by default."
              : `Settings stay locked to ${DISPLAY_CONTENT_LABELS[content].toLowerCase()} on the ${DISPLAY_SURFACE_LABELS[surface].toLowerCase()} surface.`}
          </FieldHint>
        </div>
      </div>
    </EditorSection>
  );
}

function ViewToggleFields({
  content,
  options,
  setOptions,
  surface,
}: {
  content: DisplayContent;
  options: DisplayViewOptions;
  setOptions: (updater: (current: DisplayViewOptions) => DisplayViewOptions) => void;
  surface: DisplayViewDrawerState["surface"];
}) {
  const normalized = hydrateDisplayViewConfig(options, content, surface);

  return (
    <EditorSection title="Display controls">
      <div
        className="overflow-hidden rounded-[20px] border"
        style={{ borderColor: "var(--c-border)", background: "rgba(255,255,255,0.74)" }}
      >
        <div className="grid md:grid-cols-2">
          {BOOLEAN_FIELDS.map((field, index) => {
            const disabled =
              (field.key === "showFollowCard" && surface !== "public") ||
              (field.key === "showMembershipForm" && (surface !== "public" || content !== "memberships"));
            const needsLeftBorder = index % 2 === 1;
            const needsTopBorder = index > 1;

            return (
              <div
                className={cn("px-4 py-4", needsLeftBorder && "md:border-l", needsTopBorder && "border-t")}
                key={field.key}
                style={{
                  borderColor: "var(--c-border)",
                  opacity: disabled ? 0.58 : 1,
                }}
              >
                <Toggle
                  checked={normalized[field.key]}
                  className="items-start"
                  id={field.key}
                  label={field.label}
                  onChange={(checked) =>
                    setOptions((current) => ({
                      ...current,
                      [field.key]: checked,
                    }))
                  }
                />
                <FieldHint className="mt-2 text-[12.5px]">{field.description}</FieldHint>
                {disabled && (
                  <FieldHint className="mt-1">
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
  );
}

function renderViewPreview({
  currentPublicUrl,
  currentSavedViewUrl,
  previewPath,
  previewUrl,
  surface,
  viewFormState,
}: {
  currentPublicUrl: string;
  currentSavedViewUrl: string | null;
  previewPath: string;
  previewUrl: string;
  surface: DisplayViewDrawerState["surface"];
  viewFormState: ViewFormState;
}) {
  const previewScale = surface === "tv" ? 0.5 : surface === "embed" ? 0.6 : 0.58;
  const embedSnippet =
    surface === "embed" && currentSavedViewUrl
      ? `<iframe src="${currentSavedViewUrl}" width="100%" height="720" style="border:0;" loading="lazy"></iframe>`
      : null;

  return (
    <>
      <PreviewSection title="Live preview">
        <div className="overflow-hidden rounded-[20px] border border-rim bg-white shadow-[0_16px_32px_rgba(15,23,42,0.08)]">
          <div className="relative h-[420px] overflow-hidden bg-white">
            <iframe
              className="absolute inset-0 border-0"
              src={previewPath}
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
      </PreviewSection>

      <PreviewSection title="Share & embed">
        {surface === "public" ? (
          <DisplayLinkField label="Canonical public URL" value={currentPublicUrl} />
        ) : currentSavedViewUrl ? (
          <div className="flex flex-col gap-4">
            <DisplayLinkField label="Stable display URL" value={currentSavedViewUrl} />
            {surface === "embed" && embedSnippet && (
              <DisplayLinkField copyLabel="Copy iframe" label="Embed iframe" multiline value={embedSnippet} />
            )}
          </div>
        ) : (
          <div
            className="rounded-[18px] border px-4 py-3 text-[12.5px] leading-relaxed"
            style={{ borderColor: "var(--c-border)", color: "var(--c-muted)", background: "rgba(255,255,255,0.76)" }}
          >
            Save this {surface === "embed" ? "embed" : "display"} to generate a stable URL
            {surface === "embed" ? " and iframe snippet" : ""}.
          </div>
        )}

        {surface !== "public" && (
          <div className="mt-4">
            <DisplayLinkField label="Current preview URL" value={previewUrl} />
          </div>
        )}
      </PreviewSection>
    </>
  );
}

function renderPlaylistPreview({
  playlistPreviewSlides,
  savedPlaylistUrl,
  surface,
}: {
  playlistPreviewSlides: Array<{ durationSeconds: number; src: string; title: string }>;
  savedPlaylistUrl: string | null;
  surface: SavedDisplaySurface;
}) {
  const embedSnippet =
    surface === "embed" && savedPlaylistUrl
      ? `<iframe src="${savedPlaylistUrl}" width="100%" height="720" style="border:0;" loading="lazy"></iframe>`
      : null;

  return (
    <>
      <PreviewSection title="Live preview">
        <DisplayPlaylistPlayer className="h-[420px] min-h-0 rounded-[20px] border border-rim" slides={playlistPreviewSlides} />
      </PreviewSection>

      <PreviewSection title="Share & embed">
        {savedPlaylistUrl ? (
          <div className="flex flex-col gap-4">
            <DisplayLinkField label="Stable playlist URL" value={savedPlaylistUrl} />
            {surface === "embed" && embedSnippet && (
              <DisplayLinkField copyLabel="Copy iframe" label="Embed iframe" multiline value={embedSnippet} />
            )}
          </div>
        ) : (
          <div
            className="rounded-[18px] border px-4 py-3 text-[12.5px] leading-relaxed"
            style={{ borderColor: "var(--c-border)", color: "var(--c-muted)", background: "rgba(255,255,255,0.76)" }}
          >
            Save this playlist to generate a stable URL{surface === "embed" ? " and iframe snippet" : ""}.
          </div>
        )}
      </PreviewSection>
    </>
  );
}

function EditorSection({
  children,
  description,
  title,
}: {
  children?: ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <section className="border-b px-5 py-5 md:px-6 md:py-6" style={{ borderColor: "var(--c-border)" }}>
      <div className="flex items-center gap-3">
        <div className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--c-muted)" }}>
          {title}
        </div>
        <div className="h-px flex-1" style={{ background: "var(--c-border)" }} />
      </div>
      {description && (
        <p className="mt-2 text-[13px] leading-relaxed" style={{ color: "var(--c-muted)" }}>
          {description}
        </p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </section>
  );
}

function EditorFooter({
  deleteAction,
  deleteLabel,
  submitLabel,
}: {
  deleteAction?: (formData: FormData) => void | Promise<void>;
  deleteLabel?: string;
  submitLabel: string;
}) {
  return (
    <div className="mt-auto border-t px-5 py-5 md:px-6 md:py-6" style={{ borderColor: "var(--c-border)" }}>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {deleteAction && deleteLabel && (
          <Button formAction={deleteAction} size="sm" type="submit" variant="ghost">
            {deleteLabel}
          </Button>
        )}
        <Button size="sm" type="submit">
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}

function PreviewSection({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <div className="border-b px-5 py-5 md:px-6 md:py-6" style={{ borderColor: "var(--c-border)" }}>
      <div className="flex items-center gap-3">
        <div className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--c-muted)" }}>
          {title}
        </div>
        <div className="h-px flex-1" style={{ background: "var(--c-border)" }} />
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

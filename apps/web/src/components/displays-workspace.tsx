"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button, FieldHint, FieldLabel, Input, Select, Tabs, Toggle, cn } from "@taproom/ui";

import {
  clampDisplayPreviewWidth,
  DEFAULT_DISPLAY_PREVIEW_WIDTH,
  DISPLAY_PREVIEW_WIDTH_STORAGE_KEY,
  normalizeDisplayWorkspaceState,
  serializeDisplayWorkspaceState,
  type DisplaySelectionToken,
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

const PREVIEW_SCALE_BY_SURFACE = {
  embed: 0.6,
  public: 0.58,
  tv: 0.5,
} as const;

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
  const initialWorkspaceState = normalizeDisplayWorkspaceState(initialSearchParams);
  const [workspaceState, setWorkspaceState] = useState<DisplayWorkspaceState>(initialWorkspaceState);
  const [previewWidth, setPreviewWidth] = useState(DEFAULT_DISPLAY_PREVIEW_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const splitRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setWorkspaceState(initialWorkspaceState);
  }, [
    initialWorkspaceState.content,
    initialWorkspaceState.playlist,
    initialWorkspaceState.surface,
    initialWorkspaceState.tab,
    initialWorkspaceState.view,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedWidth = window.localStorage.getItem(DISPLAY_PREVIEW_WIDTH_STORAGE_KEY);

    if (!storedWidth) {
      return;
    }

    const parsedWidth = Number(storedWidth);

    if (!Number.isFinite(parsedWidth)) {
      return;
    }

    setPreviewWidth(clampDisplayPreviewWidth(parsedWidth));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(DISPLAY_PREVIEW_WIDTH_STORAGE_KEY, String(previewWidth));
  }, [previewWidth]);

  useEffect(() => {
    if (!isResizing) {
      return;
    }

    function handlePointerMove(event: PointerEvent) {
      const bounds = splitRef.current?.getBoundingClientRect();

      if (!bounds) {
        return;
      }

      setPreviewWidth(clampDisplayPreviewWidth(bounds.right - event.clientX));
    }

    function handlePointerUp() {
      setIsResizing(false);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const query = serializeDisplayWorkspaceState(workspaceState);
    const nextUrl = query ? `${pathname}?${query}` : pathname;
    window.history.replaceState(null, "", nextUrl);
  }, [pathname, workspaceState]);

  const publicView = useMemo(
    () => views.find((view) => view.content === workspaceState.content && view.surface === "public") ?? null,
    [views, workspaceState.content],
  );
  const currentSurfaceViews = useMemo(
    () =>
      views.filter(
        (view) =>
          view.content === workspaceState.content &&
          view.surface === workspaceState.surface &&
          view.surface !== "public",
      ),
    [views, workspaceState.content, workspaceState.surface],
  );
  const tvViews = useMemo(
    () => views.filter((view) => view.content === workspaceState.content && view.surface === "tv"),
    [views, workspaceState.content],
  );
  const embedViews = useMemo(
    () => views.filter((view) => view.content === workspaceState.content && view.surface === "embed"),
    [views, workspaceState.content],
  );
  const selectedView =
    workspaceState.tab === "views" &&
    workspaceState.surface !== "public" &&
    workspaceState.view &&
    workspaceState.view !== "new"
      ? currentSurfaceViews.find((view) => view.id === workspaceState.view) ?? null
      : null;
  const activePlaylistSurface = workspaceState.tab === "playlists" && workspaceState.surface !== "public"
    ? workspaceState.surface
    : "tv";
  const surfacePlaylists = useMemo(
    () => playlists.filter((playlist) => playlist.surface === activePlaylistSurface),
    [activePlaylistSurface, playlists],
  );
  const selectedPlaylist =
    workspaceState.tab === "playlists" && workspaceState.playlist && workspaceState.playlist !== "new"
      ? surfacePlaylists.find((playlist) => playlist.id === workspaceState.playlist) ?? null
      : null;
  const activePlaylistViews = useMemo(
    () =>
      views.filter(
        (view) =>
          view.surface === activePlaylistSurface &&
          Boolean(view.slug),
      ),
    [activePlaylistSurface, views],
  );

  const [viewFormState, setViewFormState] = useState<ViewFormState>(() =>
    getInitialViewFormState({
      content: initialWorkspaceState.content,
      publicView: initialWorkspaceState.surface === "public" ? publicView : null,
      selectedView: initialWorkspaceState.surface !== "public" ? selectedView : null,
      surface: initialWorkspaceState.surface,
      viewToken: initialWorkspaceState.view,
    }),
  );
  const [playlistFormState, setPlaylistFormState] = useState<PlaylistFormState>(() =>
    getInitialPlaylistFormState(selectedPlaylist, initialWorkspaceState.playlist),
  );

  useEffect(() => {
    setViewFormState(
      getInitialViewFormState({
        content: workspaceState.content,
        publicView,
        selectedView,
        surface: workspaceState.surface,
        viewToken: workspaceState.view,
      }),
    );
  }, [publicView, selectedView, workspaceState.content, workspaceState.surface, workspaceState.view]);

  useEffect(() => {
    setPlaylistFormState(getInitialPlaylistFormState(selectedPlaylist, workspaceState.playlist));
  }, [selectedPlaylist, workspaceState.playlist]);

  const normalizedViewConfig = useMemo(
    () => hydrateDisplayViewConfig(viewFormState.options, workspaceState.content, workspaceState.surface),
    [viewFormState.options, workspaceState.content, workspaceState.surface],
  );
  const currentViewPreviewPath = useMemo(
    () => buildAdHocDisplayPath(venueSlug, normalizedViewConfig),
    [normalizedViewConfig, venueSlug],
  );
  const currentViewPreviewUrl = `${appUrl}${currentViewPreviewPath}`;
  const currentPublicUrl = `${appUrl}${getCanonicalPublicDisplayPath(venueSlug, workspaceState.content)}`;
  const currentSavedViewUrl =
    workspaceState.surface !== "public" && viewFormState.mode === "saved" && viewFormState.slug
      ? `${appUrl}${buildSavedDisplayPath(venueSlug, viewFormState.slug, workspaceState.surface)}`
      : null;
  const currentSavedPlaylistUrl =
    workspaceState.tab === "playlists" && playlistFormState.mode === "saved" && playlistFormState.slug
      ? `${appUrl}${buildSavedDisplayPath(venueSlug, playlistFormState.slug, activePlaylistSurface)}`
      : null;
  const playlistPreviewSlides = useMemo(() => {
    const viewById = new Map(activePlaylistViews.map((view) => [view.id, view]));

    return playlistFormState.config.slides
      .map((slide) => {
        const referencedView = viewById.get(slide.viewId);

        if (!referencedView?.slug) {
          return null;
        }

        return {
          durationSeconds: slide.durationSeconds,
          src: buildSavedDisplayPath(venueSlug, referencedView.slug, activePlaylistSurface),
          title: referencedView.name ?? DISPLAY_CONTENT_LABELS[referencedView.content],
        };
      })
      .filter((slide): slide is NonNullable<typeof slide> => Boolean(slide));
  }, [activePlaylistSurface, activePlaylistViews, playlistFormState.config.slides, venueSlug]);

  function updateWorkspace(next: Partial<DisplayWorkspaceState>) {
    setWorkspaceState((current) => ({ ...current, ...next }));
  }

  function handleTopTabChange(nextTab: string) {
    if (nextTab === "views") {
      setWorkspaceState((current) => ({
        ...current,
        playlist: null,
        surface: "public",
        tab: "views",
        view: null,
      }));
      return;
    }

    setWorkspaceState((current) => ({
      ...current,
      playlist: null,
      surface: current.surface === "public" ? "tv" : current.surface,
      tab: "playlists",
      view: null,
    }));
  }

  function handleContentChange(nextContent: string) {
    setWorkspaceState((current) => ({
      ...current,
      content: nextContent as DisplayContent,
      surface: "public",
      view: null,
    }));
  }

  function handleSelectPublicSlot() {
    updateWorkspace({ surface: "public", view: null });
  }

  function handleSelectSavedView(surface: SavedDisplaySurface, viewId: string) {
    updateWorkspace({ surface, view: viewId });
  }

  function handleCreateView(surface: SavedDisplaySurface) {
    updateWorkspace({ surface, view: "new" });
  }

  function handlePlaylistSurfaceChange(nextSurface: string) {
    updateWorkspace({
      playlist: null,
      surface: nextSurface as SavedDisplaySurface,
    });
  }

  function handleSelectSavedPlaylist(playlistId: string) {
    updateWorkspace({ playlist: playlistId, surface: activePlaylistSurface });
  }

  function handleCreatePlaylist() {
    updateWorkspace({ playlist: "new", surface: activePlaylistSurface });
  }

  const previewContent = workspaceState.tab === "views"
    ? renderViewPreview({
        currentPublicUrl,
        currentSavedViewUrl,
        previewPath: currentViewPreviewPath,
        previewScale: PREVIEW_SCALE_BY_SURFACE[workspaceState.surface],
        previewUrl: currentViewPreviewUrl,
        surface: workspaceState.surface,
        viewFormState,
      })
    : renderPlaylistPreview({
        activePlaylistSurface,
        playlistFormState,
        playlistPreviewSlides,
        savedPlaylistUrl: currentSavedPlaylistUrl,
      });

  return (
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

      <div className="min-w-0" ref={splitRef}>
        <div className="lg:flex lg:min-h-[760px]">
          <div className="min-w-0 flex-1">
            {workspaceState.tab === "views" ? (
              <div className="flex h-full min-w-0 flex-col">
                <div className="border-b px-5 py-5 md:px-6 md:py-6" style={{ borderColor: "var(--c-border)" }}>
                  <Tabs
                    active={workspaceState.content}
                    className="mb-0 border-b-0"
                    onChange={handleContentChange}
                    tabs={DISPLAY_CONTENTS.map((content) => ({
                      id: content,
                      label: DISPLAY_CONTENT_LABELS[content],
                    }))}
                  />
                </div>

                <div className="border-b px-5 py-5 md:px-6 md:py-6" style={{ borderColor: "var(--c-border)" }}>
                  <div className="grid gap-4 xl:grid-cols-3">
                    <DisplaySection
                      active={workspaceState.surface === "public"}
                      body={publicView ? "Saved public configuration" : "Using defaults until you save"}
                      ctaLabel="Edit public view"
                      onSelect={handleSelectPublicSlot}
                      title="Public"
                    />
                    <DisplayListSection
                      active={workspaceState.surface === "tv"}
                      emptyLabel="No TV displays yet."
                      items={tvViews.map((view) => ({
                        id: view.id,
                        label: view.name ?? "Untitled display",
                        meta: view.slug ? `/${view.slug}` : "Unsaved",
                      }))}
                      onCreate={() => handleCreateView("tv")}
                      onSelect={(viewId) => handleSelectSavedView("tv", viewId)}
                      selectedId={workspaceState.surface === "tv" && workspaceState.view !== "new" ? workspaceState.view : null}
                      showDraft={workspaceState.surface === "tv" && workspaceState.view === "new"}
                      title="TV Displays"
                    />
                    <DisplayListSection
                      active={workspaceState.surface === "embed"}
                      emptyLabel="No embeds yet."
                      items={embedViews.map((view) => ({
                        id: view.id,
                        label: view.name ?? "Untitled embed",
                        meta: view.slug ? `/${view.slug}` : "Unsaved",
                      }))}
                      onCreate={() => handleCreateView("embed")}
                      onSelect={(viewId) => handleSelectSavedView("embed", viewId)}
                      selectedId={workspaceState.surface === "embed" && workspaceState.view !== "new" ? workspaceState.view : null}
                      showDraft={workspaceState.surface === "embed" && workspaceState.view === "new"}
                      title="Embeds"
                    />
                  </div>
                </div>

                <div className="flex-1">
                  {workspaceState.surface === "public" ? (
                    <form action={saveViewAction} className="flex h-full flex-col">
                      <input name="content" type="hidden" value={workspaceState.content} />
                      <input name="surface" type="hidden" value="public" />
                      <input name="view_id" type="hidden" value={viewFormState.viewId ?? ""} />
                      <input name="config_json" type="hidden" value={JSON.stringify(extractDisplayViewOptions(normalizedViewConfig))} />

                      <EditorSection title={`${DISPLAY_CONTENT_LABELS[workspaceState.content]} public view`}>
                        <p className="text-[13px] leading-relaxed" style={{ color: "var(--c-muted)" }}>
                          This is the single canonical public configuration for the {DISPLAY_CONTENT_LABELS[workspaceState.content].toLowerCase()} page.
                        </p>
                      </EditorSection>

                      <ViewSettingsFields
                        content={workspaceState.content}
                        options={viewFormState.options}
                        setOptions={(updater) => setViewFormState((current) => ({ ...current, options: updater(current.options) }))}
                        surface="public"
                      />
                      <ViewToggleFields
                        content={workspaceState.content}
                        options={viewFormState.options}
                        setOptions={(updater) => setViewFormState((current) => ({ ...current, options: updater(current.options) }))}
                        surface="public"
                      />

                      <EditorFooter submitLabel="Save public view" />
                    </form>
                  ) : workspaceState.view === "new" || selectedView ? (
                    <form action={saveViewAction} className="flex h-full flex-col">
                      <input name="content" type="hidden" value={workspaceState.content} />
                      <input name="surface" type="hidden" value={workspaceState.surface} />
                      <input name="view_id" type="hidden" value={viewFormState.viewId ?? ""} />
                      <input name="config_json" type="hidden" value={JSON.stringify(extractDisplayViewOptions(normalizedViewConfig))} />

                      <EditorSection title={viewFormState.mode === "draft" ? "New display" : "Edit display"}>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="flex flex-col gap-1">
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
                              placeholder={workspaceState.surface === "tv" ? "Main taproom TV" : "Homepage embed"}
                              required
                              value={viewFormState.name}
                            />
                            <FieldHint>Use a clear name your team will recognize when building playlists or sharing links.</FieldHint>
                          </div>
                          <div className="flex flex-col gap-1">
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
                              placeholder="main-taproom-tv"
                              required
                              value={viewFormState.slug}
                            />
                            <FieldHint>The slug becomes part of the stable `/display/[slug]` URL for this surface.</FieldHint>
                          </div>
                        </div>
                      </EditorSection>

                      <ViewSettingsFields
                        content={workspaceState.content}
                        options={viewFormState.options}
                        setOptions={(updater) => setViewFormState((current) => ({ ...current, options: updater(current.options) }))}
                        surface={workspaceState.surface}
                      />
                      <ViewToggleFields
                        content={workspaceState.content}
                        options={viewFormState.options}
                        setOptions={(updater) => setViewFormState((current) => ({ ...current, options: updater(current.options) }))}
                        surface={workspaceState.surface}
                      />

                      <EditorFooter
                        deleteAction={viewFormState.mode === "saved" ? deleteViewAction : undefined}
                        deleteLabel="Delete display"
                        submitLabel={viewFormState.mode === "draft" ? "Create display" : "Save display"}
                      />
                    </form>
                  ) : (
                    <EditorEmptyState
                      body={`Select a ${DISPLAY_SURFACE_LABELS[workspaceState.surface].toLowerCase()} or create a new one for ${DISPLAY_CONTENT_LABELS[workspaceState.content].toLowerCase()}.`}
                      title="No display selected"
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="flex h-full min-w-0 flex-col">
                <div className="border-b px-5 py-5 md:px-6 md:py-6" style={{ borderColor: "var(--c-border)" }}>
                  <Tabs
                    active={activePlaylistSurface}
                    className="mb-0 border-b-0"
                    onChange={handlePlaylistSurfaceChange}
                    tabs={[
                      { id: "tv", label: "TV Displays" },
                      { id: "embed", label: "Embeds" },
                    ]}
                  />
                </div>

                <div className="border-b px-5 py-5 md:px-6 md:py-6" style={{ borderColor: "var(--c-border)" }}>
                  <DisplayListSection
                    active
                    emptyLabel={`No ${DISPLAY_SURFACE_LABELS[activePlaylistSurface].toLowerCase()} playlists yet.`}
                    items={surfacePlaylists.map((playlist) => ({
                      id: playlist.id,
                      label: playlist.name,
                      meta: `/${playlist.slug}`,
                    }))}
                    onCreate={handleCreatePlaylist}
                    onSelect={handleSelectSavedPlaylist}
                    selectedId={workspaceState.playlist !== "new" ? workspaceState.playlist : null}
                    showDraft={workspaceState.playlist === "new"}
                    title={activePlaylistSurface === "tv" ? "TV Playlists" : "Embed Playlists"}
                  />
                </div>

                <div className="flex-1">
                  {workspaceState.playlist === "new" || selectedPlaylist ? (
                    <form action={savePlaylistAction} className="flex h-full flex-col">
                      <input name="playlist_id" type="hidden" value={playlistFormState.playlistId ?? ""} />
                      <input name="surface" type="hidden" value={activePlaylistSurface} />
                      <input name="config_json" type="hidden" value={JSON.stringify(playlistFormState.config)} />

                      <EditorSection title={playlistFormState.mode === "draft" ? "New playlist" : "Edit playlist"}>
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
                          </div>
                        </div>
                      </EditorSection>

                      <EditorSection
                        description={
                          activePlaylistViews.length === 0
                            ? `Create at least one ${DISPLAY_SURFACE_LABELS[activePlaylistSurface].toLowerCase()} view before building a playlist.`
                            : undefined
                        }
                        title="Slides"
                      >
                        <div className="flex flex-col gap-3">
                          {playlistFormState.config.slides.length === 0 ? (
                            <div className="rounded-[18px] border border-dashed border-rim px-4 py-5 text-[13px] leading-relaxed" style={{ color: "var(--c-muted)", background: "rgba(255,255,255,0.72)" }}>
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
                                    {activePlaylistViews.length === 0 ? (
                                      <option value="">No matching display views yet</option>
                                    ) : (
                                      activePlaylistViews.map((view) => (
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
                              disabled={activePlaylistViews.length === 0}
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
                                        viewId: activePlaylistViews[0]?.id ?? "",
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
                  ) : (
                    <EditorEmptyState
                      body={`Select a ${DISPLAY_SURFACE_LABELS[activePlaylistSurface].toLowerCase()} playlist or create a new one.`}
                      title="No playlist selected"
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          <div
            aria-hidden="true"
            className="hidden w-3 shrink-0 cursor-col-resize border-l border-r bg-[rgba(255,255,255,0.8)] lg:block"
            onPointerDown={() => setIsResizing(true)}
            style={{ borderColor: "var(--c-border)" }}
          />

          <aside
            className="hidden shrink-0 lg:block"
            style={{
              background: "linear-gradient(180deg, rgba(250,247,243,0.96), rgba(255,255,255,0.98))",
              borderLeft: "1px solid var(--c-border)",
              width: previewWidth,
            }}
          >
            {previewContent}
          </aside>
        </div>

        <div
          className="border-t lg:hidden"
          style={{
            background: "linear-gradient(180deg, rgba(250,247,243,0.96), rgba(255,255,255,0.98))",
            borderColor: "var(--c-border)",
          }}
        >
          {previewContent}
        </div>
      </div>
    </section>
  );
}

function getInitialViewFormState({
  content,
  publicView,
  selectedView,
  surface,
  viewToken,
}: {
  content: DisplayContent;
  publicView: DisplayViewRecord | null;
  selectedView: DisplayViewRecord | null;
  surface: DisplayWorkspaceState["surface"];
  viewToken: DisplaySelectionToken;
}): ViewFormState {
  if (surface === "public") {
    return {
      mode: "public",
      name: "",
      options: publicView?.options ?? getDefaultDisplayViewOptions("public", content),
      slug: "",
      slugDirty: false,
      viewId: publicView?.id ?? null,
    };
  }

  if (viewToken === "new") {
    return {
      mode: "draft",
      name: "",
      options: getDefaultDisplayViewOptions(surface, content),
      slug: "",
      slugDirty: false,
      viewId: null,
    };
  }

  if (selectedView) {
    return {
      mode: "saved",
      name: selectedView.name ?? "",
      options: selectedView.options,
      slug: selectedView.slug ?? "",
      slugDirty: Boolean(selectedView.slug),
      viewId: selectedView.id,
    };
  }

  return {
    mode: "empty",
    name: "",
    options: getDefaultDisplayViewOptions(surface, content),
    slug: "",
    slugDirty: false,
    viewId: null,
  };
}

function getInitialPlaylistFormState(
  selectedPlaylist: DisplayPlaylistRecord | null,
  playlistToken: DisplaySelectionToken,
): PlaylistFormState {
  if (playlistToken === "new") {
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

function ViewSettingsFields({
  content,
  options,
  setOptions,
  surface,
}: {
  content: DisplayContent;
  options: DisplayViewOptions;
  setOptions: (updater: (current: DisplayViewOptions) => DisplayViewOptions) => void;
  surface: DisplayWorkspaceState["surface"];
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
              setOptions((current) => ({ ...current, linkTarget: event.target.value as DisplayViewOptions["linkTarget"] }))
            }
            value={options.linkTarget}
          >
            <option value="same-tab">Same tab</option>
            <option value="new-tab">New tab</option>
          </Select>
          <FieldHint>
            {surface === "embed"
              ? "Embed displays keep the host page open by default."
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
  surface: DisplayWorkspaceState["surface"];
}) {
  const normalized = hydrateDisplayViewConfig(options, content, surface);

  return (
    <EditorSection title="Display controls">
      <div className="overflow-hidden rounded-[20px] border" style={{ borderColor: "var(--c-border)", background: "rgba(255,255,255,0.74)" }}>
        <div className="grid md:grid-cols-2">
          {BOOLEAN_FIELDS.map((field, index) => {
            const disabled =
              (field.key === "showFollowCard" && surface !== "public") ||
              (field.key === "showMembershipForm" && (surface !== "public" || content !== "memberships"));
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
  previewScale,
  previewUrl,
  surface,
  viewFormState,
}: {
  currentPublicUrl: string;
  currentSavedViewUrl: string | null;
  previewPath: string;
  previewScale: number;
  previewUrl: string;
  surface: DisplayWorkspaceState["surface"];
  viewFormState: ViewFormState;
}) {
  const embedSnippet = surface === "embed"
    ? `<iframe src="${currentSavedViewUrl ?? previewUrl}" width="100%" height="720" style="border:0;" loading="lazy"></iframe>`
    : null;

  return (
    <>
      <PreviewSection title="Live preview">
        {viewFormState.mode === "empty" ? (
          <PreviewEmptyState body="Select a display or create a new one to load the preview." />
        ) : (
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
        )}
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
          <div className="rounded-[18px] border px-4 py-3 text-[12.5px] leading-relaxed" style={{ borderColor: "var(--c-border)", color: "var(--c-muted)", background: "rgba(255,255,255,0.76)" }}>
            Save this display to generate a stable URL{surface === "embed" ? " and iframe snippet" : ""}.
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
  activePlaylistSurface,
  playlistFormState,
  playlistPreviewSlides,
  savedPlaylistUrl,
}: {
  activePlaylistSurface: SavedDisplaySurface;
  playlistFormState: PlaylistFormState;
  playlistPreviewSlides: Array<{ durationSeconds: number; src: string; title: string }>;
  savedPlaylistUrl: string | null;
}) {
  const embedSnippet =
    activePlaylistSurface === "embed" && savedPlaylistUrl
      ? `<iframe src="${savedPlaylistUrl}" width="100%" height="720" style="border:0;" loading="lazy"></iframe>`
      : null;

  return (
    <>
      <PreviewSection title="Live preview">
        {playlistFormState.mode === "empty" ? (
          <PreviewEmptyState body="Select a playlist or create a new one to load the preview." />
        ) : (
          <DisplayPlaylistPlayer className="h-[420px] min-h-0 rounded-[20px] border border-rim" slides={playlistPreviewSlides} />
        )}
      </PreviewSection>

      <PreviewSection title="Share & embed">
        {savedPlaylistUrl ? (
          <div className="flex flex-col gap-4">
            <DisplayLinkField label="Stable playlist URL" value={savedPlaylistUrl} />
            {activePlaylistSurface === "embed" && embedSnippet && (
              <DisplayLinkField copyLabel="Copy iframe" label="Embed iframe" multiline value={embedSnippet} />
            )}
          </div>
        ) : (
          <div className="rounded-[18px] border px-4 py-3 text-[12.5px] leading-relaxed" style={{ borderColor: "var(--c-border)", color: "var(--c-muted)", background: "rgba(255,255,255,0.76)" }}>
            Save this playlist to generate a stable URL{activePlaylistSurface === "embed" ? " and iframe snippet" : ""}.
          </div>
        )}
      </PreviewSection>
    </>
  );
}

function DisplaySection({
  active,
  body,
  ctaLabel,
  onSelect,
  title,
}: {
  active?: boolean;
  body: string;
  ctaLabel: string;
  onSelect: () => void;
  title: string;
}) {
  return (
    <section className="rounded-[20px] border p-4" style={{ borderColor: active ? "var(--accent)" : "var(--c-border)", background: active ? "color-mix(in srgb, var(--accent) 7%, white)" : "rgba(255,255,255,0.88)" }}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-[12px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--c-muted)" }}>
          {title}
        </div>
        {active && (
          <div className="rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ borderColor: "var(--accent)", color: "var(--accent)", background: "white" }}>
            Active
          </div>
        )}
      </div>
      <p className="mt-3 text-[13px] leading-relaxed" style={{ color: "var(--c-muted)" }}>
        {body}
      </p>
      <Button className="mt-4" onClick={onSelect} size="sm" type="button" variant="secondary">
        {ctaLabel}
      </Button>
    </section>
  );
}

function DisplayListSection({
  active,
  emptyLabel,
  items,
  onCreate,
  onSelect,
  selectedId,
  showDraft,
  title,
}: {
  active?: boolean;
  emptyLabel: string;
  items: Array<{ id: string; label: string; meta: string }>;
  onCreate: () => void;
  onSelect: (id: string) => void;
  selectedId: string | null;
  showDraft?: boolean;
  title: string;
}) {
  return (
    <section className="rounded-[20px] border p-4" style={{ borderColor: active ? "var(--accent)" : "var(--c-border)", background: active ? "color-mix(in srgb, var(--accent) 7%, white)" : "rgba(255,255,255,0.88)" }}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-[12px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--c-muted)" }}>
          {title}
        </div>
        <Button onClick={onCreate} size="sm" type="button" variant="secondary">
          + New
        </Button>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {items.length === 0 ? (
          <div className="rounded-[16px] border border-dashed border-rim px-4 py-4 text-[13px]" style={{ color: "var(--c-muted)" }}>
            {emptyLabel}
          </div>
        ) : (
          items.map((item) => (
            <button
              className={cn(
                "rounded-[16px] border px-4 py-3 text-left transition-colors",
                selectedId === item.id ? "border-ember bg-ember/5" : "border-rim bg-white hover:border-ember/50",
              )}
              key={item.id}
              onClick={() => onSelect(item.id)}
              type="button"
            >
              <div className="text-[14px] font-semibold" style={{ color: "var(--c-text)" }}>
                {item.label}
              </div>
              <div className="mt-1 font-mono text-[11px]" style={{ color: "var(--c-muted)" }}>
                {item.meta}
              </div>
            </button>
          ))
        )}

        {showDraft && (
          <div className="rounded-[16px] border border-dashed px-4 py-3 text-[13px]" style={{ borderColor: "var(--accent)", color: "var(--accent)", background: "rgba(255,255,255,0.9)" }}>
            Draft in progress
          </div>
        )}
      </div>
    </section>
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

function EditorEmptyState({
  body,
  title,
}: {
  body: string;
  title: string;
}) {
  return (
    <div className="flex h-full items-center justify-center px-6 py-14">
      <div className="max-w-md rounded-[22px] border border-dashed border-rim bg-white/70 px-6 py-8 text-center">
        <div className="text-[16px] font-semibold" style={{ color: "var(--c-text)" }}>
          {title}
        </div>
        <p className="mt-3 text-[13px] leading-relaxed" style={{ color: "var(--c-muted)" }}>
          {body}
        </p>
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

function PreviewEmptyState({ body }: { body: string }) {
  return (
    <div className="flex min-h-[420px] items-center justify-center rounded-[20px] border border-dashed border-rim bg-white/70 px-6 text-center text-[13px]" style={{ color: "var(--c-muted)" }}>
      {body}
    </div>
  );
}

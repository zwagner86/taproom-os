import Link from "next/link";

import { cn } from "@taproom/ui";

import { DISPLAY_CONTENT_LABELS, DISPLAY_SURFACE_LABELS, buildPresetDisplayPath } from "@/lib/displays";

import type { DisplayPresetClientRecord } from "./display-preset-editor";

function PresetMetaPill({
  children,
  tone = "default",
}: {
  children: string;
  tone?: "accent" | "default" | "muted";
}) {
  const style = tone === "accent"
    ? {
        background: "color-mix(in srgb, var(--accent) 10%, white)",
        borderColor: "color-mix(in srgb, var(--accent) 18%, white)",
        color: "color-mix(in srgb, var(--accent) 76%, black)",
      }
    : tone === "muted"
      ? {
          background: "rgba(255,255,255,0.7)",
          borderColor: "rgba(15,23,42,0.08)",
          color: "var(--c-muted)",
        }
      : {
          background: "rgba(255,255,255,0.8)",
          borderColor: "var(--c-border)",
          color: "var(--c-text)",
        };

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]")} style={style}>
      {children}
    </span>
  );
}

function PresetActionLink({
  children,
  href,
  isActive = false,
  newTab = false,
}: {
  children: string;
  href: string;
  isActive?: boolean;
  newTab?: boolean;
}) {
  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
        isActive
          ? "border-ember bg-ember text-white"
          : "border-rim bg-white text-muted hover:border-ember hover:text-ember",
      )}
      href={href}
      rel={newTab ? "noreferrer" : undefined}
      target={newTab ? "_blank" : undefined}
    >
      {children}
    </Link>
  );
}

export function DisplayPresetList({
  presets,
  selectedPresetId,
  venueSlug,
}: {
  presets: DisplayPresetClientRecord[];
  selectedPresetId?: string | null;
  venueSlug: string;
}) {
  return (
    <aside
      className="flex h-full min-w-0 flex-col"
      style={{ background: "linear-gradient(180deg, rgba(248,246,242,0.98), rgba(255,255,255,0.98))" }}
    >
      <div className="border-b border-rim px-5 py-5 md:px-6 md:py-6">
        <div className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--c-muted)" }}>
          Saved Presets
        </div>
        <p className="mt-3 text-[12.5px] leading-relaxed" style={{ color: "var(--c-muted)" }}>
          Save a view once, then reuse it across public pages, embeds, TVs, and playlists.
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4 md:px-5">
        {presets.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-rim bg-white/80 px-4 py-6 text-center">
            <div className="mb-2 text-[28px]">📺</div>
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--c-muted)" }}>
              No display presets yet. Start with a single view, then build playlists from those saved slides.
            </p>
          </div>
        ) : (
          presets.map((preset) => {
            const isSelected = selectedPresetId === preset.id;

            return (
              <div
                className={cn(
                  "rounded-[20px] border px-4 py-4 shadow-[0_10px_28px_rgba(15,23,42,0.04)] transition-colors",
                  isSelected ? "border-ember" : "border-rim",
                )}
                data-selected={isSelected ? "true" : undefined}
                key={preset.id}
                style={{
                  background: isSelected
                    ? "color-mix(in srgb, var(--accent) 7%, white)"
                    : "rgba(255,255,255,0.88)",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[15px] font-semibold leading-tight" style={{ color: "var(--c-text)" }}>
                      {preset.name}
                    </div>
                    <div className="mt-1 truncate font-mono text-[11px]" style={{ color: "var(--c-muted)" }}>
                      /{preset.slug}
                    </div>
                  </div>
                  <PresetMetaPill tone={isSelected ? "accent" : "muted"}>
                    {preset.kind === "view" ? "View" : "Playlist"}
                  </PresetMetaPill>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <PresetMetaPill>{DISPLAY_SURFACE_LABELS[preset.default_surface]}</PresetMetaPill>
                  {preset.kind === "view" ? (
                    <PresetMetaPill>{DISPLAY_CONTENT_LABELS[preset.config.content]}</PresetMetaPill>
                  ) : (
                    <PresetMetaPill>{`${preset.config.slides.length} slides`}</PresetMetaPill>
                  )}
                </div>

                {preset.kind === "playlist" && preset.config.slides.length > 0 && (
                  <div className="mt-3 text-[12px] leading-relaxed" style={{ color: "var(--c-muted)" }}>
                    {preset.config.slides.map((slide) => slide.presetSlug).join(" -> ")}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <PresetActionLink href={`/app/${venueSlug}/displays?preset=${preset.slug}`} isActive={isSelected}>
                    Edit
                  </PresetActionLink>
                  <PresetActionLink href={buildPresetDisplayPath(venueSlug, preset.slug, "public")} newTab>
                    Public
                  </PresetActionLink>
                  <PresetActionLink href={buildPresetDisplayPath(venueSlug, preset.slug, "embed")} newTab>
                    Embed
                  </PresetActionLink>
                  <PresetActionLink href={buildPresetDisplayPath(venueSlug, preset.slug, "tv")} newTab>
                    TV
                  </PresetActionLink>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}

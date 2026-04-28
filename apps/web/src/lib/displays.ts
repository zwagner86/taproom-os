import { z } from "zod";

type SearchParamInput =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

export const displayContentSchema = z.enum(["menu", "drinks", "food", "events", "memberships"]);
export const displaySurfaceSchema = z.enum(["public", "embed", "tv"]);
export const savedDisplaySurfaceSchema = z.enum(["embed", "tv"]);
export const displayDensitySchema = z.enum(["comfortable", "compact"]);
export const displayAspectSchema = z.enum(["auto", "landscape", "portrait"]);
export const displayLinkTargetSchema = z.enum(["same-tab", "new-tab"]);
export const displayThemeSchema = z.enum(["venue-default", "light", "dark"]);
export const displayTransitionSchema = z.literal("fade");

export const displayViewOptionsSchema = z.object({
  density: displayDensitySchema.default("comfortable"),
  aspect: displayAspectSchema.default("auto"),
  theme: displayThemeSchema.default("venue-default"),
  showVenueName: z.boolean().default(true),
  showLogo: z.boolean().default(true),
  showTagline: z.boolean().default(true),
  showStyleMeta: z.boolean().default(true),
  showPrices: z.boolean().default(true),
  showAbv: z.boolean().default(true),
  showServings: z.boolean().default(true),
  showProducer: z.boolean().default(true),
  showComingSoon: z.boolean().default(true),
  showDescriptions: z.boolean().default(true),
  showCtas: z.boolean().default(true),
  showFollowCard: z.boolean().default(true),
  showMembershipForm: z.boolean().default(false),
  sectionIds: z.array(z.string().uuid()).default([]),
  linkTarget: displayLinkTargetSchema.default("same-tab"),
});

export const displayViewConfigSchema = displayViewOptionsSchema.extend({
  content: displayContentSchema,
  surface: displaySurfaceSchema,
});

export const displayPlaylistSlideSchema = z.object({
  viewId: z.string().trim().min(1),
  durationSeconds: z.coerce.number().int().min(3).max(120).default(12),
  transition: displayTransitionSchema.default("fade"),
});

export const displayPlaylistConfigSchema = z.object({
  slides: z.array(displayPlaylistSlideSchema).max(12).default([]),
});

export type DisplayContent = z.infer<typeof displayContentSchema>;
export type DisplaySurface = z.infer<typeof displaySurfaceSchema>;
export type SavedDisplaySurface = z.infer<typeof savedDisplaySurfaceSchema>;
export type DisplayDensity = z.infer<typeof displayDensitySchema>;
export type DisplayAspect = z.infer<typeof displayAspectSchema>;
export type DisplayLinkTarget = z.infer<typeof displayLinkTargetSchema>;
export type DisplayTheme = z.infer<typeof displayThemeSchema>;
export type DisplayTransition = z.infer<typeof displayTransitionSchema>;
export type DisplayViewOptions = z.infer<typeof displayViewOptionsSchema>;
export type DisplayViewConfig = z.infer<typeof displayViewConfigSchema>;
export type DisplayPlaylistConfig = z.infer<typeof displayPlaylistConfigSchema>;
export type DisplayPlaylistSlide = z.infer<typeof displayPlaylistSlideSchema>;

const BOOLEAN_QUERY_KEYS = {
  showAbv: "abv",
  showCtas: "ctas",
  showDescriptions: "descriptions",
  showFollowCard: "follow",
  showLogo: "logo",
  showMembershipForm: "membershipForm",
  showComingSoon: "comingSoon",
  showProducer: "producer",
  showServings: "servings",
  showPrices: "prices",
  showStyleMeta: "styleMeta",
  showTagline: "tagline",
  showVenueName: "venueName",
} satisfies Record<keyof Pick<
  DisplayViewConfig,
  | "showAbv"
  | "showCtas"
  | "showDescriptions"
  | "showFollowCard"
  | "showLogo"
  | "showMembershipForm"
  | "showComingSoon"
  | "showProducer"
  | "showServings"
  | "showPrices"
  | "showStyleMeta"
  | "showTagline"
  | "showVenueName"
>, string>;

export const DISPLAY_CONTENTS: DisplayContent[] = displayContentSchema.options;
export const DISPLAY_SURFACES: DisplaySurface[] = displaySurfaceSchema.options;
export const SAVED_DISPLAY_SURFACES: SavedDisplaySurface[] = savedDisplaySurfaceSchema.options;

export const DISPLAY_CONTENT_LABELS: Record<DisplayContent, string> = {
  drinks: "Drinks",
  events: "Events",
  food: "Food",
  memberships: "Memberships",
  menu: "Full Menu",
};

export const DISPLAY_SURFACE_LABELS: Record<DisplaySurface, string> = {
  embed: "Embed",
  public: "Public",
  tv: "TV Display",
};

export const DISPLAY_THEME_LABELS: Record<DisplayTheme, string> = {
  "venue-default": "Venue default",
  dark: "Dark",
  light: "Light",
};

const CANONICAL_PUBLIC_PATHS: Record<DisplayContent, string> = {
  drinks: "drinks",
  events: "events",
  food: "food",
  memberships: "memberships",
  menu: "menu",
};

export function getDefaultDisplayViewOptions(surface: DisplaySurface, content: DisplayContent): DisplayViewOptions {
  const base: DisplayViewConfig = {
    aspect: surface === "tv" ? "landscape" : "auto",
    content,
    density: surface === "tv" || surface === "embed" ? "compact" : "comfortable",
    linkTarget: surface === "embed" ? "new-tab" : "same-tab",
    theme: "venue-default",
    showAbv: true,
    showComingSoon: true,
    showCtas: content === "events" || content === "memberships",
    showDescriptions: true,
    showFollowCard: surface === "public",
    showLogo: surface !== "tv",
    showMembershipForm: surface === "public" && content === "memberships",
    showPrices: surface !== "tv",
    showProducer: true,
    showServings: true,
    showStyleMeta: true,
    showTagline: surface !== "embed",
    showVenueName: true,
    sectionIds: [],
    surface,
  };

  if (content === "food") {
    base.showAbv = false;
  }

  if (content === "drinks") {
    base.showPrices = surface !== "tv";
  }

  if (surface === "tv") {
    base.showCtas = false;
    base.showDescriptions = content !== "memberships";
    base.showFollowCard = false;
    base.showMembershipForm = false;
    base.showTagline = content === "menu";
  }

  if (surface === "embed") {
    base.showFollowCard = false;
    base.showMembershipForm = false;
  }

  return extractDisplayViewOptions(displayViewConfigSchema.parse(base));
}

export function getDefaultDisplayViewConfig(surface: DisplaySurface, content: DisplayContent): DisplayViewConfig {
  return displayViewConfigSchema.parse({
    ...getDefaultDisplayViewOptions(surface, content),
    content,
    surface,
  });
}

export function extractDisplayViewOptions(config: DisplayViewConfig): DisplayViewOptions {
  return displayViewOptionsSchema.parse({
    aspect: config.aspect,
    density: config.density,
    linkTarget: config.linkTarget,
    theme: config.theme,
    showAbv: config.showAbv,
    showComingSoon: config.showComingSoon,
    showCtas: config.showCtas,
    showDescriptions: config.showDescriptions,
    showFollowCard: config.showFollowCard,
    showLogo: config.showLogo,
    showMembershipForm: config.showMembershipForm,
    showPrices: config.showPrices,
    showProducer: config.showProducer,
    showServings: config.showServings,
    showStyleMeta: config.showStyleMeta,
    showTagline: config.showTagline,
    showVenueName: config.showVenueName,
    sectionIds: config.sectionIds,
  });
}

export function coerceDisplayViewOptions(
  input: unknown,
  context: { content: DisplayContent; surface: DisplaySurface },
) {
  return extractDisplayViewOptions(
    applyDisplaySurfaceRules(
      displayViewConfigSchema.parse({
        ...displayViewOptionsSchema.parse(input),
        content: context.content,
        surface: context.surface,
      }),
    ),
  );
}

export function coerceDisplayViewConfig(input: unknown) {
  return applyDisplaySurfaceRules(displayViewConfigSchema.parse(input));
}

export function hydrateDisplayViewConfig(options: DisplayViewOptions, content: DisplayContent, surface: DisplaySurface) {
  return applyDisplaySurfaceRules(
    displayViewConfigSchema.parse({
      ...options,
      content,
      surface,
    }),
  );
}

export function coerceDisplayPlaylistConfig(input: unknown) {
  return displayPlaylistConfigSchema.parse(input);
}

export function applyDisplaySurfaceRules(config: DisplayViewConfig): DisplayViewConfig {
  const next = { ...config };

  if (next.surface !== "public") {
    next.showFollowCard = false;
    next.showMembershipForm = false;
  }

  if (next.surface === "tv") {
    next.showCtas = false;
    next.linkTarget = "same-tab";
  }

  if (next.surface === "embed" && next.linkTarget === "same-tab") {
    next.linkTarget = "new-tab";
  }

  if (next.content !== "memberships") {
    next.showMembershipForm = false;
  }

  return next;
}

export function parseDisplayViewConfigFromSearchParams(
  searchParams: SearchParamInput,
  defaults: DisplayViewConfig,
): DisplayViewConfig {
  const raw: Partial<DisplayViewConfig> = {
    aspect: parseEnumValue(displayAspectSchema, getParam(searchParams, "aspect")),
    content: parseEnumValue(displayContentSchema, getParam(searchParams, "content")),
    density: parseEnumValue(displayDensitySchema, getParam(searchParams, "density")),
    linkTarget: parseEnumValue(displayLinkTargetSchema, getParam(searchParams, "linkTarget")),
    theme: parseEnumValue(displayThemeSchema, getParam(searchParams, "theme")),
    showAbv: parseBooleanValue(getParam(searchParams, BOOLEAN_QUERY_KEYS.showAbv)),
    showComingSoon: parseBooleanValue(getParam(searchParams, BOOLEAN_QUERY_KEYS.showComingSoon)),
    showCtas: parseBooleanValue(getParam(searchParams, BOOLEAN_QUERY_KEYS.showCtas)),
    showDescriptions: parseBooleanValue(getParam(searchParams, BOOLEAN_QUERY_KEYS.showDescriptions)),
    showFollowCard: parseBooleanValue(getParam(searchParams, BOOLEAN_QUERY_KEYS.showFollowCard)),
    showLogo: parseBooleanValue(getParam(searchParams, BOOLEAN_QUERY_KEYS.showLogo)),
    showMembershipForm: parseBooleanValue(getParam(searchParams, BOOLEAN_QUERY_KEYS.showMembershipForm)),
    showPrices: parseBooleanValue(getParam(searchParams, BOOLEAN_QUERY_KEYS.showPrices)),
    showProducer: parseBooleanValue(getParam(searchParams, BOOLEAN_QUERY_KEYS.showProducer)),
    showServings: parseBooleanValue(getParam(searchParams, BOOLEAN_QUERY_KEYS.showServings)),
    showStyleMeta: parseBooleanValue(getParam(searchParams, BOOLEAN_QUERY_KEYS.showStyleMeta)),
    showTagline: parseBooleanValue(getParam(searchParams, BOOLEAN_QUERY_KEYS.showTagline)),
    showVenueName: parseBooleanValue(getParam(searchParams, BOOLEAN_QUERY_KEYS.showVenueName)),
    sectionIds: parseSectionIds(getParam(searchParams, "sections")),
    surface: parseEnumValue(displaySurfaceSchema, getParam(searchParams, "surface")),
  };

  return applyDisplaySurfaceRules(
    displayViewConfigSchema.parse({
      ...defaults,
      ...removeUndefinedEntries(raw),
    }),
  );
}

export function getDisplayContentFromSearchParams(
  searchParams: SearchParamInput,
  fallback: DisplayContent = "menu",
) {
  return parseEnumValue(displayContentSchema, getParam(searchParams, "content")) ?? fallback;
}

export function serializeDisplayViewConfigToSearchParams(
  config: DisplayViewConfig,
  defaults?: Partial<DisplayViewConfig>,
) {
  const params = new URLSearchParams();

  appendParam(params, "content", config.content, defaults?.content);
  appendParam(params, "surface", config.surface, defaults?.surface);
  appendParam(params, "density", config.density, defaults?.density);
  appendParam(params, "aspect", config.aspect, defaults?.aspect);
  appendParam(params, "linkTarget", config.linkTarget, defaults?.linkTarget);
  appendParam(params, "theme", config.theme, defaults?.theme);

  appendBooleanParam(params, BOOLEAN_QUERY_KEYS.showVenueName, config.showVenueName, defaults?.showVenueName);
  appendBooleanParam(params, BOOLEAN_QUERY_KEYS.showLogo, config.showLogo, defaults?.showLogo);
  appendBooleanParam(params, BOOLEAN_QUERY_KEYS.showTagline, config.showTagline, defaults?.showTagline);
  appendBooleanParam(params, BOOLEAN_QUERY_KEYS.showStyleMeta, config.showStyleMeta, defaults?.showStyleMeta);
  appendBooleanParam(params, BOOLEAN_QUERY_KEYS.showPrices, config.showPrices, defaults?.showPrices);
  appendBooleanParam(params, BOOLEAN_QUERY_KEYS.showAbv, config.showAbv, defaults?.showAbv);
  appendBooleanParam(params, BOOLEAN_QUERY_KEYS.showServings, config.showServings, defaults?.showServings);
  appendBooleanParam(params, BOOLEAN_QUERY_KEYS.showProducer, config.showProducer, defaults?.showProducer);
  appendBooleanParam(params, BOOLEAN_QUERY_KEYS.showComingSoon, config.showComingSoon, defaults?.showComingSoon);
  appendBooleanParam(params, BOOLEAN_QUERY_KEYS.showDescriptions, config.showDescriptions, defaults?.showDescriptions);
  appendBooleanParam(params, BOOLEAN_QUERY_KEYS.showCtas, config.showCtas, defaults?.showCtas);
  appendBooleanParam(params, BOOLEAN_QUERY_KEYS.showFollowCard, config.showFollowCard, defaults?.showFollowCard);
  appendBooleanParam(params, BOOLEAN_QUERY_KEYS.showMembershipForm, config.showMembershipForm, defaults?.showMembershipForm);
  if ((config.sectionIds ?? []).length > 0 && config.sectionIds.join(",") !== defaults?.sectionIds?.join(",")) {
    params.set("sections", config.sectionIds.join(","));
  }

  return params;
}

export function buildAdHocDisplayPath(venueSlug: string, config: DisplayViewConfig) {
  const params = serializeDisplayViewConfigToSearchParams(config);
  const query = params.toString();
  return `/${getSurfacePathPrefix(config.surface)}/${venueSlug}/display${query ? `?${query}` : ""}`;
}

export function buildSavedDisplayPath(venueSlug: string, slug: string, surface: SavedDisplaySurface) {
  return `/${getSurfacePathPrefix(surface)}/${venueSlug}/display/${slug}`;
}

export const buildPresetDisplayPath = buildSavedDisplayPath;

export function getCanonicalPublicDisplayPath(venueSlug: string, content: DisplayContent) {
  return `/v/${venueSlug}/${CANONICAL_PUBLIC_PATHS[content]}`;
}

export function getSurfacePathPrefix(surface: DisplaySurface) {
  return surface === "public" ? "v" : surface;
}

function appendParam(
  params: URLSearchParams,
  key: string,
  value: string,
  defaultValue?: string,
) {
  if (defaultValue === undefined || value !== defaultValue) {
    params.set(key, value);
  }
}

function appendBooleanParam(
  params: URLSearchParams,
  key: string,
  value: boolean,
  defaultValue?: boolean,
) {
  if (defaultValue === undefined || value !== defaultValue) {
    params.set(key, value ? "1" : "0");
  }
}

function getParam(searchParams: SearchParamInput, key: string) {
  if (searchParams instanceof URLSearchParams) {
    return searchParams.get(key) ?? undefined;
  }

  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

function parseBooleanValue(value: string | undefined) {
  if (value === undefined) {
    return undefined;
  }

  if (value === "1") {
    return true;
  }

  if (value === "0") {
    return false;
  }

  return undefined;
}

function parseSectionIds(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const parsed = z.array(z.string().uuid()).safeParse(value.split(",").map((entry) => entry.trim()).filter(Boolean));
  return parsed.success ? parsed.data : undefined;
}

function parseEnumValue<T extends string>(
  schema: z.ZodType<T>,
  value: string | undefined,
): T | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = schema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}

function removeUndefinedEntries<T extends Record<string, unknown>>(input: T) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

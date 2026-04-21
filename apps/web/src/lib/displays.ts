import { z } from "zod";

type SearchParamInput =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

export const displayPresetKindSchema = z.enum(["view", "playlist"]);
export const displayContentSchema = z.enum(["menu", "drinks", "food", "events", "memberships"]);
export const displaySurfaceSchema = z.enum(["public", "embed", "tv"]);
export const displayDensitySchema = z.enum(["comfortable", "compact"]);
export const displayAspectSchema = z.enum(["auto", "landscape", "portrait"]);
export const displayLinkTargetSchema = z.enum(["same-tab", "new-tab"]);
export const displayTransitionSchema = z.literal("fade");

export const displayViewConfigSchema = z.object({
  content: displayContentSchema,
  surface: displaySurfaceSchema,
  density: displayDensitySchema.default("comfortable"),
  aspect: displayAspectSchema.default("auto"),
  showVenueName: z.boolean().default(true),
  showLogo: z.boolean().default(true),
  showTagline: z.boolean().default(true),
  showStyleMeta: z.boolean().default(true),
  showPrices: z.boolean().default(true),
  showAbv: z.boolean().default(true),
  showDescriptions: z.boolean().default(true),
  showCtas: z.boolean().default(true),
  showFollowCard: z.boolean().default(true),
  showMembershipForm: z.boolean().default(false),
  linkTarget: displayLinkTargetSchema.default("same-tab"),
});

export const displayPlaylistSlideSchema = z.object({
  presetSlug: z.string().trim().min(1),
  durationSeconds: z.coerce.number().int().min(3).max(120).default(12),
  transition: displayTransitionSchema.default("fade"),
});

export const displayPlaylistConfigSchema = z.object({
  slides: z.array(displayPlaylistSlideSchema).max(12).default([]),
});

export type DisplayPresetKind = z.infer<typeof displayPresetKindSchema>;
export type DisplayContent = z.infer<typeof displayContentSchema>;
export type DisplaySurface = z.infer<typeof displaySurfaceSchema>;
export type DisplayDensity = z.infer<typeof displayDensitySchema>;
export type DisplayAspect = z.infer<typeof displayAspectSchema>;
export type DisplayLinkTarget = z.infer<typeof displayLinkTargetSchema>;
export type DisplayTransition = z.infer<typeof displayTransitionSchema>;
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
  | "showPrices"
  | "showStyleMeta"
  | "showTagline"
  | "showVenueName"
>, string>;

export const DISPLAY_CONTENT_LABELS: Record<DisplayContent, string> = {
  drinks: "Drinks",
  events: "Events",
  food: "Food",
  memberships: "Memberships",
  menu: "Full menu",
};

export const DISPLAY_SURFACE_LABELS: Record<DisplaySurface, string> = {
  embed: "Embed",
  public: "Public",
  tv: "TV",
};

export function getDefaultDisplayViewConfig(surface: DisplaySurface, content: DisplayContent): DisplayViewConfig {
  const base: DisplayViewConfig = {
    aspect: surface === "tv" ? "landscape" : "auto",
    content,
    density: surface === "tv" || surface === "embed" ? "compact" : "comfortable",
    linkTarget: surface === "embed" ? "new-tab" : "same-tab",
    showAbv: true,
    showCtas: content === "events" || content === "memberships",
    showDescriptions: true,
    showFollowCard: surface === "public",
    showLogo: surface !== "tv",
    showMembershipForm: surface === "public" && content === "memberships",
    showPrices: surface !== "tv",
    showStyleMeta: true,
    showTagline: surface !== "embed",
    showVenueName: true,
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

  return displayViewConfigSchema.parse(base);
}

export function coerceDisplayViewConfig(input: unknown) {
  return applyDisplaySurfaceRules(displayViewConfigSchema.parse(input));
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
    showAbv: parseBooleanValue(getParam(searchParams, BOOLEAN_QUERY_KEYS.showAbv)),
    showCtas: parseBooleanValue(getParam(searchParams, BOOLEAN_QUERY_KEYS.showCtas)),
    showDescriptions: parseBooleanValue(getParam(searchParams, BOOLEAN_QUERY_KEYS.showDescriptions)),
    showFollowCard: parseBooleanValue(getParam(searchParams, BOOLEAN_QUERY_KEYS.showFollowCard)),
    showLogo: parseBooleanValue(getParam(searchParams, BOOLEAN_QUERY_KEYS.showLogo)),
    showMembershipForm: parseBooleanValue(getParam(searchParams, BOOLEAN_QUERY_KEYS.showMembershipForm)),
    showPrices: parseBooleanValue(getParam(searchParams, BOOLEAN_QUERY_KEYS.showPrices)),
    showStyleMeta: parseBooleanValue(getParam(searchParams, BOOLEAN_QUERY_KEYS.showStyleMeta)),
    showTagline: parseBooleanValue(getParam(searchParams, BOOLEAN_QUERY_KEYS.showTagline)),
    showVenueName: parseBooleanValue(getParam(searchParams, BOOLEAN_QUERY_KEYS.showVenueName)),
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

  appendBooleanParam(params, BOOLEAN_QUERY_KEYS.showVenueName, config.showVenueName, defaults?.showVenueName);
  appendBooleanParam(params, BOOLEAN_QUERY_KEYS.showLogo, config.showLogo, defaults?.showLogo);
  appendBooleanParam(params, BOOLEAN_QUERY_KEYS.showTagline, config.showTagline, defaults?.showTagline);
  appendBooleanParam(params, BOOLEAN_QUERY_KEYS.showStyleMeta, config.showStyleMeta, defaults?.showStyleMeta);
  appendBooleanParam(params, BOOLEAN_QUERY_KEYS.showPrices, config.showPrices, defaults?.showPrices);
  appendBooleanParam(params, BOOLEAN_QUERY_KEYS.showAbv, config.showAbv, defaults?.showAbv);
  appendBooleanParam(params, BOOLEAN_QUERY_KEYS.showDescriptions, config.showDescriptions, defaults?.showDescriptions);
  appendBooleanParam(params, BOOLEAN_QUERY_KEYS.showCtas, config.showCtas, defaults?.showCtas);
  appendBooleanParam(params, BOOLEAN_QUERY_KEYS.showFollowCard, config.showFollowCard, defaults?.showFollowCard);
  appendBooleanParam(params, BOOLEAN_QUERY_KEYS.showMembershipForm, config.showMembershipForm, defaults?.showMembershipForm);

  return params;
}

export function buildAdHocDisplayPath(venueSlug: string, config: DisplayViewConfig) {
  const params = serializeDisplayViewConfigToSearchParams(config);
  const query = params.toString();
  return `/${config.surface === "public" ? "v" : config.surface}/${venueSlug}/display${query ? `?${query}` : ""}`;
}

export function buildPresetDisplayPath(venueSlug: string, presetSlug: string, surface: DisplaySurface) {
  return `/${surface === "public" ? "v" : surface}/${venueSlug}/display/${presetSlug}`;
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

  if (["1", "true", "yes", "on"].includes(value)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(value)) {
    return false;
  }

  return undefined;
}

function parseEnumValue<T extends string>(schema: z.ZodType<T>, value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const result = schema.safeParse(value);
  return result.success ? result.data : undefined;
}

function removeUndefinedEntries<T extends object>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as Partial<T>;
}

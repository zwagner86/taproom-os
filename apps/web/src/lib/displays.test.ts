import { describe, expect, it } from "vitest";

import {
  applyDisplaySurfaceRules,
  buildAdHocDisplayPath,
  buildPresetDisplayPath,
  coerceDisplayPlaylistConfig,
  getDefaultDisplayViewConfig,
  parseDisplayViewConfigFromSearchParams,
  serializeDisplayViewConfigToSearchParams,
} from "./displays";

describe("display helpers", () => {
  it("round-trips query-string view config state", () => {
    const base = getDefaultDisplayViewConfig("public", "events");
    const config = {
      ...base,
      density: "compact" as const,
      linkTarget: "new-tab" as const,
      showDescriptions: false,
      showLogo: false,
      showVenueName: false,
    };

    const searchParams = serializeDisplayViewConfigToSearchParams(config);
    const hydrated = parseDisplayViewConfigFromSearchParams(
      searchParams,
      getDefaultDisplayViewConfig("public", "events"),
    );

    expect(hydrated).toEqual(config);
  });

  it("suppresses public-only controls on embed surfaces", () => {
    const embedded = applyDisplaySurfaceRules({
      ...getDefaultDisplayViewConfig("public", "memberships"),
      showFollowCard: true,
      showMembershipForm: true,
      surface: "embed",
    });

    expect(embedded.showFollowCard).toBe(false);
    expect(embedded.showMembershipForm).toBe(false);
    expect(embedded.linkTarget).toBe("new-tab");
  });

  it("suppresses CTA behavior on tv surfaces", () => {
    const tvConfig = applyDisplaySurfaceRules({
      ...getDefaultDisplayViewConfig("public", "events"),
      linkTarget: "new-tab",
      showCtas: true,
      surface: "tv",
    });

    expect(tvConfig.showCtas).toBe(false);
    expect(tvConfig.linkTarget).toBe("same-tab");
  });

  it("builds ad hoc and preset paths with the correct surface prefixes", () => {
    const config = getDefaultDisplayViewConfig("embed", "menu");

    expect(buildAdHocDisplayPath("demo-taproom", config)).toContain("/embed/demo-taproom/display");
    expect(buildPresetDisplayPath("demo-taproom", "main-board", "public")).toBe("/v/demo-taproom/display/main-board");
    expect(buildPresetDisplayPath("demo-taproom", "main-board", "tv")).toBe("/tv/demo-taproom/display/main-board");
  });

  it("coerces playlist slide defaults and validates bounds", () => {
    expect(
      coerceDisplayPlaylistConfig({
        slides: [{ presetSlug: "drinks-board" }],
      }),
    ).toEqual({
      slides: [{ durationSeconds: 12, presetSlug: "drinks-board", transition: "fade" }],
    });
  });
});

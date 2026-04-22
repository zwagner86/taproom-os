import { describe, expect, it } from "vitest";

import {
  applyDisplaySurfaceRules,
  buildAdHocDisplayPath,
  buildSavedDisplayPath,
  coerceDisplayPlaylistConfig,
  coerceDisplayViewOptions,
  getCanonicalPublicDisplayPath,
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

  it("coerces stored view options with surface rules", () => {
    const options = coerceDisplayViewOptions(
      {
        linkTarget: "same-tab",
        showFollowCard: true,
        showMembershipForm: true,
      },
      {
        content: "memberships",
        surface: "embed",
      },
    );

    expect(options.showFollowCard).toBe(false);
    expect(options.showMembershipForm).toBe(false);
    expect(options.linkTarget).toBe("new-tab");
  });

  it("builds ad hoc, saved, and canonical public paths", () => {
    const config = getDefaultDisplayViewConfig("embed", "menu");

    expect(buildAdHocDisplayPath("demo-taproom", config)).toContain("/embed/demo-taproom/display");
    expect(buildSavedDisplayPath("demo-taproom", "main-board", "tv")).toBe("/tv/demo-taproom/display/main-board");
    expect(getCanonicalPublicDisplayPath("demo-taproom", "drinks")).toBe("/v/demo-taproom/drinks");
  });

  it("coerces playlist slide defaults and validates bounds", () => {
    expect(
      coerceDisplayPlaylistConfig({
        slides: [{ viewId: "view-1" }],
      }),
    ).toEqual({
      slides: [{ durationSeconds: 12, transition: "fade", viewId: "view-1" }],
    });
  });
});

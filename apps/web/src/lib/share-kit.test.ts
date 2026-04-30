import { describe, expect, it } from "vitest";

import {
  buildAbsoluteShareUrl,
  buildCorePublicPath,
  buildCoreShareDestinations,
  buildEventPublicPath,
  buildEventShareDestination,
  parsePrintDestinationKey,
  resolvePrintLayout,
} from "./share-kit";

describe("share kit URLs", () => {
  it("builds stable core public paths", () => {
    expect(buildCorePublicPath("demo-taproom", "menu")).toBe("/v/demo-taproom/menu");
    expect(buildCorePublicPath("demo-taproom", "events")).toBe("/v/demo-taproom/events");
    expect(buildCorePublicPath("demo-taproom", "memberships")).toBe("/v/demo-taproom/memberships");
    expect(buildCorePublicPath("demo-taproom", "follow")).toBe("/v/demo-taproom/follow");
  });

  it("builds absolute URLs without duplicate slashes", () => {
    expect(buildAbsoluteShareUrl("https://taproomos.example/", "/v/demo-taproom/menu")).toBe(
      "https://taproomos.example/v/demo-taproom/menu",
    );
  });

  it("builds destination records for core pages and event IDs", () => {
    const core = buildCoreShareDestinations({
      appUrl: "https://taproomos.example",
      venueSlug: "demo-taproom",
    });
    const event = buildEventShareDestination({
      appUrl: "https://taproomos.example",
      event: {
        id: "event-1",
        starts_at: "2026-05-01T19:00:00.000Z",
        title: "Trivia Night",
      },
      venueSlug: "demo-taproom",
    });

    expect(core.map((entry) => entry.url)).toEqual([
      "https://taproomos.example/v/demo-taproom/menu",
      "https://taproomos.example/v/demo-taproom/events",
      "https://taproomos.example/v/demo-taproom/memberships",
      "https://taproomos.example/v/demo-taproom/follow",
    ]);
    expect(buildEventPublicPath("demo-taproom", "event-1")).toBe("/v/demo-taproom/events/event-1");
    expect(event.url).toBe("https://taproomos.example/v/demo-taproom/events/event-1");
    expect(event.printKey).toBe("event-event-1");
  });

  it("parses print destination keys and layouts", () => {
    expect(parsePrintDestinationKey("menu")).toEqual({ id: "menu", kind: "menu" });
    expect(parsePrintDestinationKey("event-123")).toEqual({ eventId: "123", kind: "event" });
    expect(parsePrintDestinationKey("unknown")).toBeNull();
    expect(resolvePrintLayout("letter")).toBe("letter");
    expect(resolvePrintLayout("half-letter")).toBe("half-letter");
    expect(resolvePrintLayout("photo-4x6")).toBe("photo-4x6");
    expect(resolvePrintLayout("poster")).toBe("letter");
    expect(resolvePrintLayout("tent")).toBe("letter");
    expect(resolvePrintLayout(undefined)).toBe("letter");
    expect(resolvePrintLayout(["photo-4x6", "letter"])).toBe("photo-4x6");
  });
});

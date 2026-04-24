import { describe, expect, it } from "vitest";

import type { VenueRow } from "@/server/repositories/venues";

import { DEMO_MODE_DETAIL } from "./demo-venue";
import {
  createDemoMutationResult,
  demoVenueReducer,
  initialDemoVenueState,
  type DemoCheckInSessionRecord,
  type DemoDisplayPlaylistRecord,
  type DemoDisplayViewRecord,
  type DemoEventBookingRecord,
  type DemoEventRecord,
  type DemoItemRecord,
  type DemoMembershipPlanRecord,
  type DemoMembershipRecord,
  type DemoNotificationLogRecord,
} from "./demo-venue-state";

describe("demo venue state", () => {
  it("builds the default demo mutation message", () => {
    expect(createDemoMutationResult("Saved in demo mode.")).toEqual({
      detail: DEMO_MODE_DETAIL,
      message: "Saved in demo mode.",
    });
  });

  it("seeds venue data once and applies local venue edits", () => {
    const seeded = demoVenueReducer(initialDemoVenueState, {
      type: "seed_venue",
      venue: makeVenue(),
    });
    const updated = demoVenueReducer(seeded, {
      type: "update_venue",
      venue: {
        membership_label: "Bottle Society",
        name: "Preview Taproom",
      },
    });
    const ignoredReseed = demoVenueReducer(updated, {
      type: "seed_venue",
      venue: makeVenue({ name: "Original Demo Taproom" }),
    });

    expect(seeded.venue?.name).toBe("Demo Taproom");
    expect(updated.venue?.name).toBe("Preview Taproom");
    expect(updated.venue?.membership_label).toBe("Bottle Society");
    expect(ignoredReseed.venue?.name).toBe("Preview Taproom");
  });

  it("seeds, sorts, upserts, and deletes demo items locally", () => {
    const seeded = demoVenueReducer(initialDemoVenueState, {
      items: [
        makeItem({ display_order: 2, id: "item-2", name: "Crisp Pils" }),
        makeItem({ display_order: 1, id: "item-1", name: "Amber Ale" }),
      ],
      type: "seed_items",
    });
    const withNewItem = demoVenueReducer(seeded, {
      item: makeItem({ display_order: 1, id: "item-3", name: "Bar Snacks" }),
      type: "upsert_item",
    });
    const withoutSeedOverride = demoVenueReducer(withNewItem, {
      items: [makeItem({ display_order: 0, id: "item-9", name: "Should Not Replace" })],
      type: "seed_items",
    });
    const deleted = demoVenueReducer(withoutSeedOverride, {
      itemId: "item-2",
      type: "delete_item",
    });

    expect(seeded.items?.map((item) => item.name)).toEqual(["Amber Ale", "Crisp Pils"]);
    expect(withNewItem.items?.map((item) => item.name)).toEqual(["Amber Ale", "Bar Snacks", "Crisp Pils"]);
    expect(withoutSeedOverride.items?.map((item) => item.id)).toEqual(["item-1", "item-3", "item-2"]);
    expect(deleted.items?.map((item) => item.id)).toEqual(["item-1", "item-3"]);
  });

  it("keeps display views and playlists in local demo state", () => {
    const seeded = demoVenueReducer(initialDemoVenueState, {
      playlists: [
        makePlaylist({ id: "playlist-2", name: "Taproom Loop", surface: "tv" }),
        makePlaylist({ id: "playlist-1", name: "Embed Rotation", surface: "embed" }),
      ],
      type: "seed_displays",
      views: [
        makeView({ content: "menu", id: "view-2", name: "Main Board", surface: "tv" }),
        makeView({ content: "events", id: "view-3", name: "Events Board", surface: "tv" }),
        makeView({ content: "menu", id: "view-1", name: "Site Embed", surface: "embed" }),
      ],
    });
    const withUpdatedView = demoVenueReducer(seeded, {
      type: "upsert_display_view",
      view: makeView({ content: "menu", id: "view-2", name: "Renamed Board", surface: "tv" }),
    });
    const withNewPlaylist = demoVenueReducer(withUpdatedView, {
      playlist: makePlaylist({ id: "playlist-3", name: "Alpha TV Loop", surface: "tv" }),
      type: "upsert_display_playlist",
    });
    const deleted = demoVenueReducer(withNewPlaylist, {
      playlistId: "playlist-1",
      type: "delete_display_playlist",
    });

    expect(seeded.displays.views?.map((view) => `${view.content}:${view.surface}:${view.name}`)).toEqual([
      "events:tv:Events Board",
      "menu:embed:Site Embed",
      "menu:tv:Main Board",
    ]);
    expect(withUpdatedView.displays.views?.find((view) => view.id === "view-2")?.name).toBe("Renamed Board");
    expect(withNewPlaylist.displays.playlists?.map((playlist) => `${playlist.surface}:${playlist.name}`)).toEqual([
      "embed:Embed Rotation",
      "tv:Alpha TV Loop",
      "tv:Taproom Loop",
    ]);
    expect(deleted.displays.playlists?.map((playlist) => playlist.id)).toEqual(["playlist-3", "playlist-2"]);
  });

  it("tracks demo events and check-in changes for the current tab", () => {
    const seededEvents = demoVenueReducer(initialDemoVenueState, {
      events: [
        makeEvent({ id: "event-2", starts_at: "2026-05-02T18:00:00.000Z", title: "Friday Flights" }),
        makeEvent({ id: "event-1", starts_at: "2026-05-01T18:00:00.000Z", title: "Thursday Trivia" }),
      ],
      type: "seed_events",
    });
    const withEventAdmin = demoVenueReducer(seededEvents, {
      eventId: "event-1",
      state: {
        bookings: [makeBooking()],
        session: null,
      },
      type: "seed_event_admin",
    });
    const withSession = demoVenueReducer(withEventAdmin, {
      eventId: "event-1",
      session: makeSession(),
      type: "set_check_in_session",
    });
    const withCheckIn = demoVenueReducer(withSession, {
      bookingId: "booking-1",
      checkedInCount: 2,
      eventId: "event-1",
      type: "set_booking_check_in_count",
    });
    const withUpdatedEvent = demoVenueReducer(withCheckIn, {
      event: makeEvent({ id: "event-1", starts_at: "2026-05-01T18:00:00.000Z", title: "Thursday Trivia Preview" }),
      type: "upsert_event",
    });

    expect(seededEvents.events?.map((event) => event.id)).toEqual(["event-1", "event-2"]);
    expect(withSession.eventAdmin["event-1"]?.session?.token).toBe("shared-demo-token");
    expect(withCheckIn.eventAdmin["event-1"]?.bookings[0]?.checked_in_count).toBe(2);
    expect(withUpdatedEvent.events?.find((event) => event.id === "event-1")?.title).toBe("Thursday Trivia Preview");
  });

  it("sorts membership and notification overlays independently", () => {
    const seeded = demoVenueReducer(initialDemoVenueState, {
      memberships: [
        makeMembership({ created_at: "2026-05-02T09:00:00.000Z", id: "membership-2", member_name: "Casey" }),
        makeMembership({ created_at: "2026-05-03T09:00:00.000Z", id: "membership-1", member_name: "Alex" }),
      ],
      plans: [
        makePlan({ created_at: "2026-04-02T09:00:00.000Z", id: "plan-2", name: "Gold" }),
        makePlan({ created_at: "2026-04-01T09:00:00.000Z", id: "plan-1", name: "Silver" }),
      ],
      type: "seed_memberships",
    });
    const withPlanUpdate = demoVenueReducer(seeded, {
      plan: makePlan({ active: false, created_at: "2026-04-01T09:00:00.000Z", id: "plan-1", name: "Silver" }),
      type: "upsert_membership_plan",
    });
    const withMembershipUpdate = demoVenueReducer(withPlanUpdate, {
      membership: makeMembership({ created_at: "2026-05-03T09:00:00.000Z", id: "membership-1", member_name: "Alex", status: "cancelled" }),
      type: "upsert_membership",
    });
    const seededLogs = demoVenueReducer(withMembershipUpdate, {
      logs: [
        makeNotificationLog({ created_at: "2026-05-02T10:00:00.000Z", id: "log-2", recipient: "Later Guest" }),
        makeNotificationLog({ created_at: "2026-05-01T10:00:00.000Z", id: "log-1", recipient: "Earlier Guest" }),
      ],
      type: "seed_notifications",
    });
    const withAppendedLog = demoVenueReducer(seededLogs, {
      log: makeNotificationLog({ created_at: "2026-05-03T10:00:00.000Z", id: "log-3", recipient: "Newest Guest" }),
      type: "append_notification_log",
    });

    expect(seeded.memberships.plans?.map((plan) => plan.id)).toEqual(["plan-1", "plan-2"]);
    expect(seeded.memberships.memberships?.map((membership) => membership.id)).toEqual(["membership-1", "membership-2"]);
    expect(withMembershipUpdate.memberships.memberships?.find((membership) => membership.id === "membership-1")?.status).toBe("cancelled");
    expect(withPlanUpdate.memberships.plans?.find((plan) => plan.id === "plan-1")?.active).toBe(false);
    expect(withAppendedLog.notifications.logs?.map((log) => log.id)).toEqual(["log-3", "log-2", "log-1"]);
  });
});

function makeVenue(overrides: Partial<VenueRow> = {}): VenueRow {
  return {
    accent_color: "#c96b2c",
    created_at: "2026-04-01T09:00:00.000Z",
    display_theme: "light",
    id: "venue-1",
    logo_url: null,
    membership_label: "Mug Club",
    menu_label: "Tap List",
    name: "Demo Taproom",
    secondary_accent_color: "#2E9F9A",
    slug: "demo-taproom",
    tagline: "Small batch. Big character.",
    updated_at: "2026-04-01T09:00:00.000Z",
    venue_type: "brewery",
    ...overrides,
  };
}

function makeItem(overrides: Partial<DemoItemRecord> = {}): DemoItemRecord {
  return {
    display_order: 0,
    id: "item-1",
    name: "Demo Item",
    type: "pour",
    ...overrides,
  } as DemoItemRecord;
}

function makeView(overrides: Partial<DemoDisplayViewRecord> = {}): DemoDisplayViewRecord {
  return {
    content: "menu",
    id: "view-1",
    name: "Demo View",
    surface: "tv",
    ...overrides,
  } as DemoDisplayViewRecord;
}

function makePlaylist(overrides: Partial<DemoDisplayPlaylistRecord> = {}): DemoDisplayPlaylistRecord {
  return {
    config: { slides: [] },
    id: "playlist-1",
    name: "Demo Playlist",
    surface: "tv",
    ...overrides,
  } as DemoDisplayPlaylistRecord;
}

function makeEvent(overrides: Partial<DemoEventRecord> = {}): DemoEventRecord {
  return {
    id: "event-1",
    starts_at: "2026-05-01T18:00:00.000Z",
    title: "Demo Event",
    ...overrides,
  } as DemoEventRecord;
}

function makeBooking(overrides: Partial<DemoEventBookingRecord> = {}): DemoEventBookingRecord {
  return {
    checked_in_count: 0,
    id: "booking-1",
    party_size: 3,
    ...overrides,
  } as DemoEventBookingRecord;
}

function makeSession(overrides: Partial<DemoCheckInSessionRecord> = {}): DemoCheckInSessionRecord {
  return {
    event_id: "event-1",
    id: "session-1",
    token: "shared-demo-token",
    ...overrides,
  } as DemoCheckInSessionRecord;
}

function makePlan(overrides: Partial<DemoMembershipPlanRecord> = {}): DemoMembershipPlanRecord {
  return {
    active: true,
    created_at: "2026-04-01T09:00:00.000Z",
    id: "plan-1",
    name: "Demo Plan",
    ...overrides,
  } as DemoMembershipPlanRecord;
}

function makeMembership(overrides: Partial<DemoMembershipRecord> = {}): DemoMembershipRecord {
  return {
    created_at: "2026-05-01T09:00:00.000Z",
    id: "membership-1",
    member_name: "Demo Member",
    status: "active",
    ...overrides,
  } as DemoMembershipRecord;
}

function makeNotificationLog(overrides: Partial<DemoNotificationLogRecord> = {}): DemoNotificationLogRecord {
  return {
    created_at: "2026-05-01T10:00:00.000Z",
    id: "log-1",
    recipient: "Demo Recipient",
    ...overrides,
  } as DemoNotificationLogRecord;
}

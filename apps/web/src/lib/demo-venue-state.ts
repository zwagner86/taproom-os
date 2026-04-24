import type { listEventBookings, listVenueEvents, getCheckInSessionForEvent } from "@/server/repositories/events";
import type { listVenueDisplayPlaylists } from "@/server/repositories/display-playlists";
import type { listVenueDisplayViews } from "@/server/repositories/display-views";
import type { listVenueItems } from "@/server/repositories/items";
import type { listVenueMembershipPlans, listVenueMemberships } from "@/server/repositories/memberships";
import type { listVenueNotificationLogs } from "@/server/repositories/notifications";
import type { VenueRow } from "@/server/repositories/venues";

import { DEMO_MODE_DETAIL } from "@/lib/demo-venue";

export type DemoItemRecord = Awaited<ReturnType<typeof listVenueItems>>[number];
export type DemoDisplayViewRecord = Awaited<ReturnType<typeof listVenueDisplayViews>>[number];
export type DemoDisplayPlaylistRecord = Awaited<ReturnType<typeof listVenueDisplayPlaylists>>[number];
export type DemoEventRecord = Awaited<ReturnType<typeof listVenueEvents>>[number];
export type DemoEventBookingRecord = Awaited<ReturnType<typeof listEventBookings>>[number];
export type DemoCheckInSessionRecord = NonNullable<Awaited<ReturnType<typeof getCheckInSessionForEvent>>>;
export type DemoMembershipPlanRecord = Awaited<ReturnType<typeof listVenueMembershipPlans>>[number];
export type DemoMembershipRecord = Awaited<ReturnType<typeof listVenueMemberships>>[number];
export type DemoNotificationLogRecord = Awaited<ReturnType<typeof listVenueNotificationLogs>>[number];

export type DemoCheckInState = {
  bookings: DemoEventBookingRecord[];
  session: DemoCheckInSessionRecord | null;
};

export type DemoMutationResult = {
  detail: string;
  message: string;
};

export type DemoVenueState = {
  displays: {
    playlists: DemoDisplayPlaylistRecord[] | null;
    views: DemoDisplayViewRecord[] | null;
  };
  eventAdmin: Record<string, DemoCheckInState | undefined>;
  events: DemoEventRecord[] | null;
  items: DemoItemRecord[] | null;
  memberships: {
    memberships: DemoMembershipRecord[] | null;
    plans: DemoMembershipPlanRecord[] | null;
  };
  notifications: {
    logs: DemoNotificationLogRecord[] | null;
  };
  venue: VenueRow | null;
};

export type DemoVenueAction =
  | { type: "seed_venue"; venue: VenueRow }
  | { type: "update_venue"; venue: Partial<VenueRow> }
  | { items: DemoItemRecord[]; type: "seed_items" }
  | { item: DemoItemRecord; type: "upsert_item" }
  | { itemId: string; type: "delete_item" }
  | {
      playlists: DemoDisplayPlaylistRecord[];
      type: "seed_displays";
      views: DemoDisplayViewRecord[];
    }
  | { playlist: DemoDisplayPlaylistRecord; type: "upsert_display_playlist" }
  | { playlistId: string; type: "delete_display_playlist" }
  | { type: "upsert_display_view"; view: DemoDisplayViewRecord }
  | { type: "delete_display_view"; viewId: string }
  | { events: DemoEventRecord[]; type: "seed_events" }
  | { event: DemoEventRecord; type: "upsert_event" }
  | { eventId: string; state: DemoCheckInState; type: "seed_event_admin" }
  | { eventId: string; session: DemoCheckInSessionRecord; type: "set_check_in_session" }
  | {
      bookingId: string;
      checkedInCount: number;
      eventId: string;
      type: "set_booking_check_in_count";
    }
  | {
      memberships: DemoMembershipRecord[];
      plans: DemoMembershipPlanRecord[];
      type: "seed_memberships";
    }
  | { membership: DemoMembershipRecord; type: "upsert_membership" }
  | { plan: DemoMembershipPlanRecord; type: "upsert_membership_plan" }
  | { logs: DemoNotificationLogRecord[]; type: "seed_notifications" }
  | { log: DemoNotificationLogRecord; type: "append_notification_log" };

export const initialDemoVenueState: DemoVenueState = {
  displays: {
    playlists: null,
    views: null,
  },
  eventAdmin: {},
  events: null,
  items: null,
  memberships: {
    memberships: null,
    plans: null,
  },
  notifications: {
    logs: null,
  },
  venue: null,
};

export function createDemoMutationResult(message: string, detail = DEMO_MODE_DETAIL): DemoMutationResult {
  return { detail, message };
}

export function demoVenueReducer(state: DemoVenueState, action: DemoVenueAction): DemoVenueState {
  switch (action.type) {
    case "seed_venue":
      return state.venue ? state : { ...state, venue: action.venue };
    case "update_venue":
      return state.venue
        ? {
            ...state,
            venue: {
              ...state.venue,
              ...action.venue,
            },
          }
        : state;
    case "seed_items":
      return state.items ? state : { ...state, items: sortItems(action.items) };
    case "upsert_item":
      return {
        ...state,
        items: sortItems(upsertById(state.items ?? [], action.item)),
      };
    case "delete_item":
      return {
        ...state,
        items: (state.items ?? []).filter((item) => item.id !== action.itemId),
      };
    case "seed_displays":
      return state.displays.views || state.displays.playlists
        ? state
        : {
            ...state,
            displays: {
              playlists: sortPlaylists(action.playlists),
              views: sortViews(action.views),
            },
          };
    case "upsert_display_view":
      return {
        ...state,
        displays: {
          ...state.displays,
          views: sortViews(upsertById(state.displays.views ?? [], action.view)),
        },
      };
    case "delete_display_view":
      return {
        ...state,
        displays: {
          ...state.displays,
          views: (state.displays.views ?? []).filter((view) => view.id !== action.viewId),
        },
      };
    case "upsert_display_playlist":
      return {
        ...state,
        displays: {
          ...state.displays,
          playlists: sortPlaylists(upsertById(state.displays.playlists ?? [], action.playlist)),
        },
      };
    case "delete_display_playlist":
      return {
        ...state,
        displays: {
          ...state.displays,
          playlists: (state.displays.playlists ?? []).filter((playlist) => playlist.id !== action.playlistId),
        },
      };
    case "seed_events":
      return state.events ? state : { ...state, events: sortEvents(action.events) };
    case "upsert_event":
      return {
        ...state,
        events: sortEvents(upsertById(state.events ?? [], action.event)),
      };
    case "seed_event_admin":
      return state.eventAdmin[action.eventId]
        ? state
        : {
            ...state,
            eventAdmin: {
              ...state.eventAdmin,
              [action.eventId]: action.state,
            },
          };
    case "set_check_in_session": {
      const current = state.eventAdmin[action.eventId];

      if (!current) {
        return state;
      }

      return {
        ...state,
        eventAdmin: {
          ...state.eventAdmin,
          [action.eventId]: {
            ...current,
            session: action.session,
          },
        },
      };
    }
    case "set_booking_check_in_count": {
      const current = state.eventAdmin[action.eventId];

      if (!current) {
        return state;
      }

      return {
        ...state,
        eventAdmin: {
          ...state.eventAdmin,
          [action.eventId]: {
            ...current,
            bookings: current.bookings.map((booking) =>
              booking.id === action.bookingId
                ? {
                    ...booking,
                    checked_in_count: action.checkedInCount,
                  }
                : booking,
            ),
          },
        },
      };
    }
    case "seed_memberships":
      return state.memberships.plans || state.memberships.memberships
        ? state
        : {
            ...state,
            memberships: {
              memberships: sortMemberships(action.memberships),
              plans: sortMembershipPlans(action.plans),
            },
          };
    case "upsert_membership":
      return {
        ...state,
        memberships: {
          ...state.memberships,
          memberships: sortMemberships(upsertById(state.memberships.memberships ?? [], action.membership)),
        },
      };
    case "upsert_membership_plan":
      return {
        ...state,
        memberships: {
          ...state.memberships,
          plans: sortMembershipPlans(upsertById(state.memberships.plans ?? [], action.plan)),
        },
      };
    case "seed_notifications":
      return state.notifications.logs
        ? state
        : {
            ...state,
            notifications: {
              logs: sortNotificationLogs(action.logs),
            },
          };
    case "append_notification_log":
      return {
        ...state,
        notifications: {
          logs: sortNotificationLogs([action.log, ...(state.notifications.logs ?? [])]),
        },
      };
    default:
      return state;
  }
}

function upsertById<T extends { id: string }>(rows: T[], nextRow: T) {
  const existingIndex = rows.findIndex((row) => row.id === nextRow.id);

  if (existingIndex === -1) {
    return [...rows, nextRow];
  }

  return rows.map((row) => (row.id === nextRow.id ? nextRow : row));
}

function sortItems(items: DemoItemRecord[]) {
  return [...items].sort((left, right) => {
    if (left.display_order !== right.display_order) {
      return left.display_order - right.display_order;
    }

    return left.name.localeCompare(right.name);
  });
}

function sortViews(views: DemoDisplayViewRecord[]) {
  return [...views].sort((left, right) => {
    const contentCompare = left.content.localeCompare(right.content);

    if (contentCompare !== 0) {
      return contentCompare;
    }

    const surfaceCompare = left.surface.localeCompare(right.surface);

    if (surfaceCompare !== 0) {
      return surfaceCompare;
    }

    return String(left.name ?? "").localeCompare(String(right.name ?? ""));
  });
}

function sortPlaylists(playlists: DemoDisplayPlaylistRecord[]) {
  return [...playlists].sort((left, right) => {
    const surfaceCompare = left.surface.localeCompare(right.surface);

    if (surfaceCompare !== 0) {
      return surfaceCompare;
    }

    return left.name.localeCompare(right.name);
  });
}

function sortEvents(events: DemoEventRecord[]) {
  return [...events].sort((left, right) => left.starts_at.localeCompare(right.starts_at));
}

function sortMembershipPlans(plans: DemoMembershipPlanRecord[]) {
  return [...plans].sort((left, right) => left.created_at.localeCompare(right.created_at));
}

function sortMemberships(memberships: DemoMembershipRecord[]) {
  return [...memberships].sort((left, right) => right.created_at.localeCompare(left.created_at));
}

function sortNotificationLogs(logs: DemoNotificationLogRecord[]) {
  return [...logs].sort((left, right) => right.created_at.localeCompare(left.created_at));
}

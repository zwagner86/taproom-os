"use client";

import { applyCheckInDelta } from "@taproom/domain";
import { normalizeHexColor } from "@/lib/colors";
import {
  coerceDisplayPlaylistConfig,
  coerceDisplayViewOptions,
  displayContentSchema,
  displaySurfaceSchema,
  hydrateDisplayViewConfig,
  savedDisplaySurfaceSchema,
  type DisplayContent,
  type SavedDisplaySurface,
} from "@/lib/displays";
import {
  createDemoMutationResult,
  demoVenueReducer,
  initialDemoVenueState,
  type DemoCheckInState,
  type DemoDisplayPlaylistRecord,
  type DemoDisplayViewRecord,
  type DemoEventRecord,
  type DemoItemRecord,
  type DemoMembershipPlanRecord,
  type DemoMembershipRecord,
  type DemoMutationResult,
  type DemoNotificationLogRecord,
  type DemoVenueState,
} from "@/lib/demo-venue-state";
import { slugify } from "@/lib/utils";
import type { VenuePaymentCapability } from "@taproom/domain";
import type { VenueRow } from "@/server/repositories/venues";
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from "react";

type DemoVenueContextValue = {
  createCheckInSession: (eventId: string, formData: FormData) => DemoMutationResult;
  createEvent: (formData: FormData, capability: VenuePaymentCapability) => DemoMutationResult;
  createItem: (formData: FormData) => DemoMutationResult;
  createMembershipPlan: (formData: FormData, capability: VenuePaymentCapability) => DemoMutationResult;
  deleteDisplayPlaylist: (formData: FormData) => DemoMutationResult;
  deleteDisplayView: (formData: FormData) => DemoMutationResult;
  deleteItem: (itemId: string) => DemoMutationResult;
  demoMode: boolean;
  dispatchSeedEventAdmin: (eventId: string, state: DemoCheckInState) => void;
  dispatchSeedDisplays: (views: DemoDisplayViewRecord[], playlists: DemoDisplayPlaylistRecord[]) => void;
  dispatchSeedEvents: (events: DemoEventRecord[]) => void;
  dispatchSeedItems: (items: DemoItemRecord[]) => void;
  dispatchSeedMemberships: (plans: DemoMembershipPlanRecord[], memberships: DemoMembershipRecord[]) => void;
  dispatchSeedNotifications: (logs: DemoNotificationLogRecord[]) => void;
  saveDisplayPlaylist: (formData: FormData) => DemoMutationResult;
  saveDisplayView: (formData: FormData) => DemoMutationResult;
  saveVenueSettings: (formData: FormData) => DemoMutationResult;
  sendBroadcast: (formData: FormData) => DemoMutationResult;
  state: DemoVenueState;
  toggleItemActive: (itemId: string, active: boolean) => DemoMutationResult;
  updateCheckIn: (eventId: string, formData: FormData) => DemoMutationResult;
  updateEvent: (formData: FormData, capability: VenuePaymentCapability) => DemoMutationResult;
  updateMembershipPlan: (formData: FormData, capability: VenuePaymentCapability) => DemoMutationResult;
  updateMembershipStatus: (membershipId: string, mode: "cancel" | "resume") => DemoMutationResult;
};

const DemoVenueContext = createContext<DemoVenueContextValue | null>(null);

export function DemoVenueProvider({
  children,
  currentUserId,
  demoMode,
  initialVenue,
}: {
  children: React.ReactNode;
  currentUserId: string | null;
  demoMode: boolean;
  initialVenue: VenueRow;
}) {
  const [state, dispatch] = useReducer(demoVenueReducer, {
    ...initialDemoVenueState,
    venue: initialVenue,
  });
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const dispatchSeedItems = useCallback((items: DemoItemRecord[]) => {
    dispatch({ items, type: "seed_items" });
  }, []);

  const dispatchSeedDisplays = useCallback((views: DemoDisplayViewRecord[], playlists: DemoDisplayPlaylistRecord[]) => {
    dispatch({ playlists, type: "seed_displays", views });
  }, []);

  const dispatchSeedEvents = useCallback((events: DemoEventRecord[]) => {
    dispatch({ events, type: "seed_events" });
  }, []);

  const dispatchSeedEventAdmin = useCallback((eventId: string, nextState: DemoCheckInState) => {
    dispatch({ eventId, state: nextState, type: "seed_event_admin" });
  }, []);

  const dispatchSeedMemberships = useCallback((plans: DemoMembershipPlanRecord[], memberships: DemoMembershipRecord[]) => {
    dispatch({ memberships, plans, type: "seed_memberships" });
  }, []);

  const dispatchSeedNotifications = useCallback((logs: DemoNotificationLogRecord[]) => {
    dispatch({ logs, type: "seed_notifications" });
  }, []);

  const saveVenueSettings = useCallback((formData: FormData) => {
    const venue = requireDemoVenue(stateRef.current);
    const accentColor = normalizeHexColor(String(formData.get("accent_color") ?? venue.accent_color));

    if (!accentColor) {
      throw new Error("Accent color must be a 3- or 6-digit hex value like #C96B2C.");
    }

    dispatch({
      type: "update_venue",
      venue: {
        accent_color: accentColor,
        logo_url: normalizeOptionalString(formData.get("logo_url")),
        membership_label: String(formData.get("membership_label") ?? venue.membership_label).trim() || "Club",
        menu_label: String(formData.get("menu_label") ?? venue.menu_label).trim() || "Tap List",
        name: String(formData.get("name") ?? venue.name).trim() || venue.name,
        tagline: normalizeOptionalString(formData.get("tagline")),
        updated_at: new Date().toISOString(),
        venue_type: String(formData.get("venue_type") ?? venue.venue_type) as VenueRow["venue_type"],
      },
    });

    return createDemoMutationResult("Venue settings updated for demo.");
  }, []);

  const createItem = useCallback((formData: FormData) => {
    const currentState = stateRef.current;
    const venue = requireDemoVenue(currentState);
    const items = currentState.items ?? [];
    const nextDisplayOrder = items.reduce((maxOrder, item) => Math.max(maxOrder, item.display_order), 0) + 1;
    const now = new Date().toISOString();

    dispatch({
      item: {
        abv: parseOptionalNumber(formData.get("abv")),
        active: true,
        created_at: now,
        description: normalizeOptionalString(formData.get("description")),
        display_order: parseOptionalInteger(formData.get("display_order")) ?? nextDisplayOrder,
        id: createDemoId("item"),
        image_url: normalizeOptionalString(formData.get("image_url")),
        item_external_links: [],
        name: String(formData.get("name") ?? "").trim(),
        price_source: "unpriced",
        style_or_category: normalizeOptionalString(formData.get("style_or_category")),
        type: String(formData.get("type") ?? "pour") as DemoItemRecord["type"],
        updated_at: now,
        venue_id: venue.id,
      },
      type: "upsert_item",
    });

    return createDemoMutationResult("Item created for demo.");
  }, []);

  const toggleItemActive = useCallback((itemId: string, active: boolean) => {
    const item = (stateRef.current.items ?? []).find((entry) => entry.id === itemId);

    if (!item) {
      throw new Error("Item not found.");
    }

    dispatch({
      item: {
        ...item,
        active,
        updated_at: new Date().toISOString(),
      },
      type: "upsert_item",
    });

    return createDemoMutationResult(`Item ${active ? "shown" : "hidden"} for demo.`);
  }, []);

  const deleteItem = useCallback((itemId: string) => {
    dispatch({ itemId, type: "delete_item" });
    return createDemoMutationResult("Item removed for demo.");
  }, []);

  const saveDisplayView = useCallback((formData: FormData) => {
    const currentState = stateRef.current;
    const venue = requireDemoVenue(currentState);
    const content = displayContentSchema.parse(String(formData.get("content") ?? "menu"));
    const surface = displaySurfaceSchema.parse(String(formData.get("surface") ?? "public"));
    const rawOptions = parseJsonObject(formData.get("config_json"), "Display config must be a JSON object.");
    const options = coerceDisplayViewOptions(rawOptions, { content, surface });
    const now = new Date().toISOString();
    const views = currentState.displays.views ?? [];

    if (surface === "public") {
      const existingPublicView = views.find((view) => view.surface === "public" && view.content === content) ?? null;
      const publicView: DemoDisplayViewRecord = {
        config: hydrateDisplayViewConfig(options, content, surface),
        content,
        created_at: existingPublicView?.created_at ?? now,
        id: existingPublicView?.id ?? createDemoId("display-view"),
        name: null,
        options,
        slug: null,
        surface,
        updated_at: now,
        venue_id: venue.id,
      };

      dispatch({ type: "upsert_display_view", view: publicView });
      return createDemoMutationResult("Public display saved for demo.");
    }

    const viewId = normalizeOptionalString(formData.get("view_id"));
    const name = String(formData.get("name") ?? "").trim();
    const slug = slugify(String(formData.get("slug") ?? name));

    if (!name) {
      throw new Error("Display name is required.");
    }

    if (!slug) {
      throw new Error("Display slug is required.");
    }

    ensureDisplaySlugAvailable(currentState, surface, slug, { viewId });

    const existingView = viewId ? views.find((view) => view.id === viewId) ?? null : null;

    if (viewId && !existingView) {
      throw new Error("Display view not found.");
    }

    dispatch({
      type: "upsert_display_view",
      view: {
        config: hydrateDisplayViewConfig(options, content, surface),
        content,
        created_at: existingView?.created_at ?? now,
        id: existingView?.id ?? createDemoId("display-view"),
        name,
        options,
        slug,
        surface,
        updated_at: now,
        venue_id: venue.id,
      },
    });

    return createDemoMutationResult(existingView ? "Display view saved for demo." : "Display view created for demo.");
  }, []);

  const deleteDisplayView = useCallback((formData: FormData) => {
    const currentState = stateRef.current;
    const viewId = String(formData.get("view_id") ?? "");
    const view = (currentState.displays.views ?? []).find((entry) => entry.id === viewId) ?? null;

    if (!view) {
      throw new Error("Display view not found.");
    }

    if (view.surface === "public") {
      throw new Error("Public display slots cannot be deleted.");
    }

    const blockingPlaylist = (currentState.displays.playlists ?? []).find((playlist) =>
      playlist.config.slides.some((slide) => slide.viewId === viewId),
    );

    if (blockingPlaylist) {
      throw new Error(`"${view.name}" is still used by playlist "${blockingPlaylist.name}". Remove it from that playlist first.`);
    }

    dispatch({ type: "delete_display_view", viewId });
    return createDemoMutationResult("Display view deleted for demo.");
  }, []);

  const saveDisplayPlaylist = useCallback((formData: FormData) => {
    const currentState = stateRef.current;
    const venue = requireDemoVenue(currentState);
    const playlistId = normalizeOptionalString(formData.get("playlist_id"));
    const surface = savedDisplaySurfaceSchema.parse(String(formData.get("surface") ?? "tv"));
    const name = String(formData.get("name") ?? "").trim();
    const slug = slugify(String(formData.get("slug") ?? name));
    const now = new Date().toISOString();

    if (!name) {
      throw new Error("Playlist name is required.");
    }

    if (!slug) {
      throw new Error("Playlist slug is required.");
    }

    ensureDisplaySlugAvailable(currentState, surface, slug, { playlistId });

    const views = currentState.displays.views ?? [];
    const viewMap = new Map(views.map((view) => [view.id, view]));
    const config = validateDisplayPlaylistConfig(
      parseJsonObject(formData.get("config_json"), "Playlist config must be a JSON object."),
      surface,
      viewMap,
    );
    const existingPlaylist = playlistId
      ? (currentState.displays.playlists ?? []).find((playlist) => playlist.id === playlistId) ?? null
      : null;

    if (playlistId && !existingPlaylist) {
      throw new Error("Playlist not found.");
    }

    dispatch({
      playlist: {
        config,
        created_at: existingPlaylist?.created_at ?? now,
        id: existingPlaylist?.id ?? createDemoId("display-playlist"),
        name,
        slug,
        surface,
        updated_at: now,
        venue_id: venue.id,
      },
      type: "upsert_display_playlist",
    });

    return createDemoMutationResult(existingPlaylist ? "Playlist saved for demo." : "Playlist created for demo.");
  }, []);

  const deleteDisplayPlaylist = useCallback((formData: FormData) => {
    const playlistId = String(formData.get("playlist_id") ?? "");
    const playlist = (stateRef.current.displays.playlists ?? []).find((entry) => entry.id === playlistId) ?? null;

    if (!playlist) {
      throw new Error("Playlist not found.");
    }

    dispatch({ playlistId, type: "delete_display_playlist" });
    return createDemoMutationResult("Playlist deleted for demo.");
  }, []);

  const createEvent = useCallback((formData: FormData, capability: VenuePaymentCapability) => {
    const venue = requireDemoVenue(stateRef.current);
    const now = new Date().toISOString();
    const payload = buildCreateEventRecord(venue.id, formData, capability);
    dispatch({ event: { ...payload.event, created_at: now, id: createDemoId("event"), updated_at: now }, type: "upsert_event" });
    return createDemoMutationResult(payload.message);
  }, []);

  const updateEvent = useCallback((formData: FormData, capability: VenuePaymentCapability) => {
    const currentState = stateRef.current;
    const eventId = String(formData.get("event_id") ?? "");
    const existing = (currentState.events ?? []).find((event) => event.id === eventId) ?? null;

    if (!existing) {
      throw new Error("Event not found.");
    }

    const payload = buildUpdateEventRecord(existing, formData, capability);
    dispatch({
      event: {
        ...existing,
        ...payload.event,
        id: existing.id,
        updated_at: new Date().toISOString(),
      },
      type: "upsert_event",
    });

    return createDemoMutationResult(payload.message);
  }, []);

  const createCheckInSession = useCallback((eventId: string, formData: FormData) => {
    const currentState = stateRef.current;
    const eventAdmin = currentState.eventAdmin[eventId];
    const venue = requireDemoVenue(currentState);

    if (!eventAdmin) {
      throw new Error("Check-in state not found.");
    }

    if (eventAdmin.session) {
      return createDemoMutationResult("Shared session already exists for demo.");
    }

    const now = new Date().toISOString();
    dispatch({
      eventId,
      session: {
        created_at: now,
        created_by_user_id: currentUserId,
        event_id: eventId,
        expires_at: null,
        id: createDemoId("check-in-session"),
        pin: normalizeOptionalString(formData.get("pin")),
        session_name: String(formData.get("session_name") ?? "Shared check-in").trim() || "Shared check-in",
        token: createDemoToken(),
        updated_at: now,
        venue_id: venue.id,
      },
      type: "set_check_in_session",
    });

    return createDemoMutationResult("Shared session created for demo.");
  }, [currentUserId]);

  const updateCheckIn = useCallback((eventId: string, formData: FormData) => {
    const currentState = stateRef.current;
    const eventAdmin = currentState.eventAdmin[eventId];

    if (!eventAdmin) {
      throw new Error("Check-in state not found.");
    }

    const bookingId = String(formData.get("booking_id") ?? "");
    const booking = eventAdmin.bookings.find((entry) => entry.id === bookingId) ?? null;

    if (!booking) {
      throw new Error("Booking not found.");
    }

    dispatch({
      bookingId,
      checkedInCount: applyCheckInDelta(booking.checked_in_count, booking.party_size, parseDelta(formData.get("delta"))),
      eventId,
      type: "set_booking_check_in_count",
    });

    return createDemoMutationResult("Check-in updated for demo.");
  }, []);

  const createMembershipPlan = useCallback((formData: FormData, capability: VenuePaymentCapability) => {
    const currentState = stateRef.current;
    const venue = requireDemoVenue(currentState);
    const now = new Date().toISOString();
    const payload = buildCreateMembershipPlanRecord(venue.id, formData, capability);

    dispatch({
      plan: {
        ...payload.plan,
        created_at: now,
        id: createDemoId("membership-plan"),
        updated_at: now,
      },
      type: "upsert_membership_plan",
    });

    return createDemoMutationResult(payload.message);
  }, []);

  const updateMembershipPlan = useCallback((formData: FormData, capability: VenuePaymentCapability) => {
    const currentState = stateRef.current;
    const planId = String(formData.get("plan_id") ?? "");
    const existing = (currentState.memberships.plans ?? []).find((plan) => plan.id === planId) ?? null;

    if (!existing) {
      throw new Error("Membership plan not found.");
    }

    const payload = buildUpdatedMembershipPlanRecord(existing, formData, capability);

    dispatch({
      plan: {
        ...existing,
        ...payload.plan,
        id: existing.id,
        updated_at: new Date().toISOString(),
      },
      type: "upsert_membership_plan",
    });

    return createDemoMutationResult(payload.message);
  }, []);

  const updateMembershipStatus = useCallback((membershipId: string, mode: "cancel" | "resume") => {
    const membership = (stateRef.current.memberships.memberships ?? []).find((entry) => entry.id === membershipId) ?? null;

    if (!membership) {
      throw new Error("Membership not found.");
    }

    if (mode === "cancel") {
      dispatch({
        membership: {
          ...membership,
          cancel_at_period_end: true,
          cancelled_at: new Date().toISOString(),
          current_period_end:
            membership.current_period_end ??
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: "active",
          updated_at: new Date().toISOString(),
        },
        type: "upsert_membership",
      });

      return createDemoMutationResult("Membership scheduled to cancel for demo.");
    }

    dispatch({
      membership: {
        ...membership,
        cancel_at_period_end: false,
        cancelled_at: null,
        ended_at: null,
        status: "active",
        updated_at: new Date().toISOString(),
      },
      type: "upsert_membership",
    });

    return createDemoMutationResult("Membership resumed for demo.");
  }, []);

  const sendBroadcast = useCallback((formData: FormData) => {
    const currentState = stateRef.current;
    const venue = requireDemoVenue(currentState);
    const channel = String(formData.get("channel") ?? "email") as DemoNotificationLogRecord["channel"];
    const body = String(formData.get("body") ?? "").trim();

    if (!body) {
      throw new Error("Add a message before sending.");
    }

    const now = new Date().toISOString();
    dispatch({
      log: {
        channel,
        context_id: null,
        context_type: "demo_broadcast",
        created_at: now,
        error_message: null,
        id: createDemoId("notification-log"),
        provider: "demo",
        provider_message_id: null,
        recipient: "Demo audience",
        sent_at: now,
        status: "sent",
        subject: normalizeOptionalString(formData.get("subject")),
        template_key: "demo_broadcast",
        venue_id: venue.id,
      },
      type: "append_notification_log",
    });

    return createDemoMutationResult("Broadcast preview sent for demo.");
  }, []);

  const value = useMemo<DemoVenueContextValue>(
    () => ({
      createCheckInSession,
      createEvent,
      createItem,
      createMembershipPlan,
      deleteDisplayPlaylist,
      deleteDisplayView,
      deleteItem,
      demoMode,
      dispatchSeedDisplays,
      dispatchSeedEventAdmin,
      dispatchSeedEvents,
      dispatchSeedItems,
      dispatchSeedMemberships,
      dispatchSeedNotifications,
      saveDisplayPlaylist,
      saveDisplayView,
      saveVenueSettings,
      sendBroadcast,
      state,
      toggleItemActive,
      updateCheckIn,
      updateEvent,
      updateMembershipPlan,
      updateMembershipStatus,
    }),
    [
      createCheckInSession,
      createEvent,
      createItem,
      createMembershipPlan,
      deleteDisplayPlaylist,
      deleteDisplayView,
      deleteItem,
      demoMode,
      dispatchSeedDisplays,
      dispatchSeedEventAdmin,
      dispatchSeedEvents,
      dispatchSeedItems,
      dispatchSeedMemberships,
      dispatchSeedNotifications,
      saveDisplayPlaylist,
      saveDisplayView,
      saveVenueSettings,
      sendBroadcast,
      state,
      toggleItemActive,
      updateCheckIn,
      updateEvent,
      updateMembershipPlan,
      updateMembershipStatus,
    ],
  );

  return <DemoVenueContext.Provider value={value}>{children}</DemoVenueContext.Provider>;
}

export function useDemoVenue() {
  const context = useContext(DemoVenueContext);

  if (!context) {
    throw new Error("useDemoVenue must be used within a DemoVenueProvider.");
  }

  return context;
}

function requireDemoVenue(state: DemoVenueState) {
  if (!state.venue) {
    throw new Error("Demo venue state is unavailable.");
  }

  return state.venue;
}

function buildCreateEventRecord(
  venueId: string,
  formData: FormData,
  capability: VenuePaymentCapability,
) {
  const title = String(formData.get("title") ?? "").trim();
  const priceCents = parseOptionalInteger(formData.get("price_cents"));
  const requestedStatus = String(formData.get("status") ?? "draft");
  const blockedFromPublishingPaidEvent =
    requestedStatus === "published" && priceCents !== null && !capability.canSellPaidEvents;
  const status = blockedFromPublishingPaidEvent ? "draft" : requestedStatus;

  return {
    event: {
      capacity: parseOptionalInteger(formData.get("capacity")),
      currency: String(formData.get("currency") ?? "USD").trim().toUpperCase() || "USD",
      description: normalizeOptionalString(formData.get("description")),
      ends_at: normalizeOptionalDate(formData.get("ends_at")),
      image_url: normalizeOptionalString(formData.get("image_url")),
      price_cents: priceCents,
      published: status === "published",
      slug: slugify(String(formData.get("slug") ?? title)),
      starts_at: normalizeRequiredDate(formData.get("starts_at")),
      status,
      title,
      venue_id: venueId,
    },
    message: blockedFromPublishingPaidEvent
      ? "Paid events still require Stripe, so this demo event was kept as a draft."
      : "Event created for demo.",
  };
}

function buildUpdateEventRecord(
  existing: DemoEventRecord,
  formData: FormData,
  capability: VenuePaymentCapability,
) {
  const title = String(formData.get("title") ?? "").trim();
  const priceCents = parseOptionalInteger(formData.get("price_cents"));
  const requestedStatus = String(formData.get("status") ?? "draft");
  const blockedFromPublishingPaidEvent =
    !existing.published && requestedStatus === "published" && priceCents !== null && !capability.canSellPaidEvents;
  const status = blockedFromPublishingPaidEvent ? "draft" : requestedStatus;

  return {
    event: {
      capacity: parseOptionalInteger(formData.get("capacity")),
      currency: String(formData.get("currency") ?? "USD").trim().toUpperCase() || "USD",
      description: normalizeOptionalString(formData.get("description")),
      ends_at: normalizeOptionalDate(formData.get("ends_at")),
      image_url: normalizeOptionalString(formData.get("image_url")),
      price_cents: priceCents,
      published: status === "published",
      slug: slugify(String(formData.get("slug") ?? title)),
      starts_at: normalizeRequiredDate(formData.get("starts_at")),
      status,
      title,
    },
    message: blockedFromPublishingPaidEvent
      ? "Paid events still require Stripe, so this demo event remains in draft."
      : "Event updated for demo.",
  };
}

function buildCreateMembershipPlanRecord(
  venueId: string,
  formData: FormData,
  capability: VenuePaymentCapability,
) {
  const name = String(formData.get("name") ?? "").trim();
  const requestedActive = String(formData.get("active") ?? "on") === "on";
  const blockedFromActivatingPlan = requestedActive && !capability.canSellMemberships;

  return {
    message: blockedFromActivatingPlan
      ? "Memberships still require Stripe, so this demo plan was kept as a draft."
      : "Membership plan created for demo.",
    plan: {
      active: blockedFromActivatingPlan ? false : requestedActive,
      billing_interval: String(formData.get("billing_interval") ?? "month") as DemoMembershipPlanRecord["billing_interval"],
      currency: String(formData.get("currency") ?? "USD").trim().toUpperCase() || "USD",
      description: normalizeOptionalString(formData.get("description")),
      name,
      price_cents: parseOptionalInteger(formData.get("price_cents")) ?? 0,
      slug: slugify(String(formData.get("slug") ?? name)),
      stripe_price_id: null,
      stripe_product_id: null,
      venue_id: venueId,
    },
  };
}

function buildUpdatedMembershipPlanRecord(
  existing: DemoMembershipPlanRecord,
  formData: FormData,
  capability: VenuePaymentCapability,
) {
  const name = String(formData.get("name") ?? "").trim();
  const requestedActive = String(formData.get("active") ?? "off") === "on";
  const blockedFromActivatingPlan = !existing.active && requestedActive && !capability.canSellMemberships;

  return {
    message: blockedFromActivatingPlan
      ? "Memberships still require Stripe, so this demo plan remains in draft."
      : "Membership plan updated for demo.",
    plan: {
      active: blockedFromActivatingPlan ? false : requestedActive,
      billing_interval: String(formData.get("billing_interval") ?? "month") as DemoMembershipPlanRecord["billing_interval"],
      currency: String(formData.get("currency") ?? "USD").trim().toUpperCase() || "USD",
      description: normalizeOptionalString(formData.get("description")),
      name,
      price_cents: parseOptionalInteger(formData.get("price_cents")) ?? 0,
      slug: slugify(String(formData.get("slug") ?? name)),
    },
  };
}

function ensureDisplaySlugAvailable(
  state: DemoVenueState,
  surface: SavedDisplaySurface,
  slug: string,
  options: { playlistId?: string | null; viewId?: string | null } = {},
) {
  const view = (state.displays.views ?? []).find((entry) => entry.surface === surface && entry.slug === slug) ?? null;
  const playlist =
    (state.displays.playlists ?? []).find((entry) => entry.surface === surface && entry.slug === slug) ?? null;

  if (view && view.id !== options.viewId) {
    throw new Error(`The slug "${slug}" is already used by display view "${view.name}".`);
  }

  if (playlist && playlist.id !== options.playlistId) {
    throw new Error(`The slug "${slug}" is already used by playlist "${playlist.name}".`);
  }
}

function validateDisplayPlaylistConfig(
  input: unknown,
  surface: SavedDisplaySurface,
  viewMap: Map<string, DemoDisplayViewRecord>,
) {
  const config = coerceDisplayPlaylistConfig(input);

  for (const slide of config.slides) {
    const referencedView = viewMap.get(slide.viewId);

    if (!referencedView) {
      throw new Error("Each playlist slide must reference an existing display view.");
    }

    if (referencedView.surface === "public") {
      throw new Error("Public display views cannot be added to playlists.");
    }

    if (referencedView.surface !== surface) {
      throw new Error("Playlist slides must all use display views from the same surface.");
    }
  }

  return config;
}

function parseJsonObject(value: FormDataEntryValue | null, errorMessage: string) {
  const rawValue = String(value ?? "{}");
  const parsed = JSON.parse(rawValue) as unknown;

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(errorMessage);
  }

  return parsed;
}

function normalizeOptionalString(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : null;
}

function parseOptionalInteger(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    return null;
  }

  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseOptionalNumber(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    return null;
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeRequiredDate(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  return new Date(normalized).toISOString();
}

function normalizeOptionalDate(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  return normalized ? new Date(normalized).toISOString() : null;
}

function parseDelta(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();

  if (normalized === "all") {
    return Number.MAX_SAFE_INTEGER;
  }

  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) ? parsed : 1;
}

function createDemoId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createDemoToken() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `demo-${crypto.randomUUID()}`;
  }

  return `demo-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

import { describe, expect, it } from "vitest";

import {
  applyCheckInDelta,
  calculateEventBookingTotal,
  calculateApplicationFee,
  canResumeMembership,
  followerPrefersChannel,
  resolveVenuePaymentCapability,
  resolveDisplayedPrice,
  resolveTerminology,
  sortBookingsForCheckIn,
  ItemTypeSchema,
} from "./index";

describe("domain helpers", () => {
  it("falls back to default terminology labels", () => {
    expect(resolveTerminology(null)).toEqual({
      menuLabel: "Tap List",
      membershipLabel: "Club",
    });
  });

  it("formats synced Square prices", () => {
    expect(
      resolveDisplayedPrice(
        { priceSource: "square" },
        { priceSnapshotCents: 900, priceSnapshotCurrency: "USD" },
      ),
    ).toBe("$9.00");
  });

  it("does not allow event as a catalog item type", () => {
    expect(ItemTypeSchema.safeParse("pour").success).toBe(true);
    expect(ItemTypeSchema.safeParse("event").success).toBe(false);
  });

  it("calculates application fees in cents", () => {
    expect(calculateApplicationFee(3200, 0.1)).toBe(320);
  });

  it("calculates event booking totals", () => {
    expect(calculateEventBookingTotal(1800, 3)).toBe(5400);
  });

  it("sorts live check-in bookings by partial, pending, then full", () => {
    const sorted = sortBookingsForCheckIn([
      { purchaserName: "Chris", partySize: 4, checkedInCount: 4 },
      { purchaserName: "Aly", partySize: 4, checkedInCount: 0 },
      { purchaserName: "Bex", partySize: 4, checkedInCount: 2 },
    ]);

    expect(sorted.map((booking) => booking.purchaserName)).toEqual(["Bex", "Aly", "Chris"]);
  });

  it("clamps check-in counts inside the valid party range", () => {
    expect(applyCheckInDelta(3, 8, 10)).toBe(8);
    expect(applyCheckInDelta(1, 8, -4)).toBe(0);
  });

  it("filters followers by channel preference", () => {
    expect(followerPrefersChannel({ active: true, channelPreferences: ["email"] }, "email")).toBe(true);
    expect(followerPrefersChannel({ active: true, channelPreferences: ["email"] }, "sms")).toBe(false);
  });

  it("allows resume only for scheduled membership cancellations", () => {
    expect(
      canResumeMembership({
        cancelAtPeriodEnd: true,
        endedAt: null,
        status: "active",
      }),
    ).toBe(true);
    expect(
      canResumeMembership({
        cancelAtPeriodEnd: false,
        endedAt: null,
        status: "active",
      }),
    ).toBe(false);
  });

  it("marks venues without Stripe as not connected for paid commerce", () => {
    expect(resolveVenuePaymentCapability(null)).toEqual({
      blockingReason: "Connect or create your Stripe account to enable paid ticket sales and membership subscriptions.",
      canIssueRefunds: false,
      canSellMemberships: false,
      canSellPaidEvents: false,
      status: "not_connected",
    });
  });

  it("marks incomplete Stripe onboarding separately from a hard restriction", () => {
    expect(
      resolveVenuePaymentCapability({
        chargesEnabled: false,
        detailsSubmitted: true,
        lastError: null,
        status: "pending",
        stripeAccountId: "acct_pending",
      }),
    ).toEqual({
      blockingReason: "Finish Stripe onboarding before enabling paid ticket sales, membership subscriptions, or TaproomOS refunds.",
      canIssueRefunds: false,
      canSellMemberships: false,
      canSellPaidEvents: false,
      status: "onboarding_incomplete",
    });
    expect(
      resolveVenuePaymentCapability({
        chargesEnabled: false,
        detailsSubmitted: false,
        lastError: "Verification needed",
        status: "error",
        stripeAccountId: "acct_restricted",
      }),
    ).toEqual({
      blockingReason: "Verification needed",
      canIssueRefunds: false,
      canSellMemberships: false,
      canSellPaidEvents: false,
      status: "restricted",
    });
  });

  it("marks fully onboarded connected accounts as ready", () => {
    expect(
      resolveVenuePaymentCapability({
        chargesEnabled: true,
        detailsSubmitted: true,
        lastError: null,
        status: "active",
        stripeAccountId: "acct_ready",
      }),
    ).toEqual({
      blockingReason: null,
      canIssueRefunds: true,
      canSellMemberships: true,
      canSellPaidEvents: true,
      status: "ready",
    });
  });
});

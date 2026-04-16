import { describe, expect, it } from "vitest";

import {
  applyCheckInDelta,
  calculateEventBookingTotal,
  calculateApplicationFee,
  canResumeMembership,
  followerPrefersChannel,
  resolveDisplayedPrice,
  resolveTerminology,
  sortBookingsForCheckIn,
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
});

import type { VenuePaymentCapability } from "@taproom/domain";

type VenuePaymentCapabilityStatus = VenuePaymentCapability["status"];

export const venuePaymentCapabilityLabels: Record<VenuePaymentCapabilityStatus, string> = {
  not_connected: "Not connected",
  onboarding_incomplete: "Onboarding incomplete",
  ready: "Ready for paid commerce",
  restricted: "Restricted",
};

export const stripeOptionalFeatureList = [
  "Menus and item updates",
  "Free events and guest-list check-in",
  "TV displays, embeds, and QR pages",
  "Follower capture and announcements",
  "Square-linked catalog syncing",
] as const;

export function getVenuePaymentCapabilityLabel(status: VenuePaymentCapabilityStatus) {
  return venuePaymentCapabilityLabels[status];
}

export function getPaidEventGateCopy() {
  return "Connect Stripe to enable paid ticket sales.";
}

export function getMembershipGateCopy() {
  return "Connect Stripe to enable membership subscriptions.";
}

export function getRefundGateCopy() {
  return "Finish Stripe setup before issuing refunds from TaproomOS.";
}

export function getBillingCapabilitySummary(capability: VenuePaymentCapability) {
  switch (capability.status) {
    case "ready":
      return "Paid memberships, paid event ticketing, and refunds are enabled for this venue.";
    case "restricted":
      return capability.blockingReason ?? "Stripe connected, but the account is restricted until the venue resolves Stripe requirements.";
    case "onboarding_incomplete":
      return capability.blockingReason ?? "Stripe onboarding is started but not ready for live paid commerce yet.";
    case "not_connected":
    default:
      return "TaproomOS still works for menus, free events, followers, displays, and Square-linked catalog management without Stripe.";
  }
}

import { z } from "zod";

export const providerConnectionStatuses = ["not_connected", "pending", "active", "error"] as const;
export const ProviderConnectionStatusSchema = z.enum(providerConnectionStatuses);
export const venuePaymentCapabilityStatuses = [
  "not_connected",
  "onboarding_incomplete",
  "restricted",
  "ready",
] as const;
export const VenuePaymentCapabilityStatusSchema = z.enum(venuePaymentCapabilityStatuses);

export const StripeConnectionSchema = z.object({
  id: z.string().uuid(),
  venueId: z.string().uuid(),
  stripeAccountId: z.string().nullable().default(null),
  status: ProviderConnectionStatusSchema.default("not_connected"),
  chargesEnabled: z.boolean().default(false),
  detailsSubmitted: z.boolean().default(false),
  lastError: z.string().nullable().default(null),
  lastSyncedAt: z.string().datetime().nullable().default(null),
});

export const SquareCatalogResultSchema = z.object({
  id: z.string().min(1),
  itemId: z.string().nullable().default(null),
  name: z.string().min(1),
  variationName: z.string().nullable().default(null),
  priceCents: z.number().int().nonnegative().nullable().default(null),
  currency: z.string().length(3).nullable().default(null),
  available: z.boolean().nullable().default(null),
});

export const VenuePaymentCapabilitySchema = z.object({
  status: VenuePaymentCapabilityStatusSchema,
  canSellPaidEvents: z.boolean(),
  canSellMemberships: z.boolean(),
  canIssueRefunds: z.boolean(),
  blockingReason: z.string().nullable().default(null),
});

export type StripeConnection = z.infer<typeof StripeConnectionSchema>;
export type SquareCatalogResult = z.infer<typeof SquareCatalogResultSchema>;
export type VenuePaymentCapability = z.infer<typeof VenuePaymentCapabilitySchema>;

export function resolveVenuePaymentCapability(
  connection:
    | Pick<StripeConnection, "stripeAccountId" | "status" | "chargesEnabled" | "detailsSubmitted" | "lastError">
    | null
    | undefined,
): VenuePaymentCapability {
  if (!connection?.stripeAccountId) {
    return {
      blockingReason: "Connect or create your Stripe account to enable paid ticket sales and membership subscriptions.",
      canIssueRefunds: false,
      canSellMemberships: false,
      canSellPaidEvents: false,
      status: "not_connected",
    };
  }

  if (connection.status === "error") {
    return {
      blockingReason:
        connection.lastError ??
        "Stripe marked this connected account as restricted. Review billing to finish any required fixes.",
      canIssueRefunds: false,
      canSellMemberships: false,
      canSellPaidEvents: false,
      status: "restricted",
    };
  }

  if (connection.chargesEnabled && connection.detailsSubmitted && connection.status === "active") {
    return {
      blockingReason: null,
      canIssueRefunds: true,
      canSellMemberships: true,
      canSellPaidEvents: true,
      status: "ready",
    };
  }

  return {
    blockingReason:
      connection.lastError ??
      "Finish Stripe onboarding before enabling paid ticket sales, membership subscriptions, or TaproomOS refunds.",
    canIssueRefunds: false,
    canSellMemberships: false,
    canSellPaidEvents: false,
    status: "onboarding_incomplete",
  };
}

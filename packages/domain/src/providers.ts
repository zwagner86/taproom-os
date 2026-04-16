import { z } from "zod";

export const providerConnectionStatuses = ["not_connected", "pending", "active", "error"] as const;
export const ProviderConnectionStatusSchema = z.enum(providerConnectionStatuses);

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

export type StripeConnection = z.infer<typeof StripeConnectionSchema>;
export type SquareCatalogResult = z.infer<typeof SquareCatalogResultSchema>;

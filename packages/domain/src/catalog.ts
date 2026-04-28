import { z } from "zod";

export const itemTypes = ["pour", "food", "merch"] as const;
export const priceSources = ["unpriced", "manual", "square"] as const;
export const itemStatuses = ["active", "coming_soon", "hidden"] as const;

export const ItemTypeSchema = z.enum(itemTypes);
export const PriceSourceSchema = z.enum(priceSources);
export const ItemStatusSchema = z.enum(itemStatuses);

export const ItemExternalLinkSchema = z.object({
  id: z.string().uuid(),
  itemId: z.string().uuid(),
  provider: z.enum(["square"]),
  externalId: z.string().min(1),
  priceSnapshotCents: z.number().int().nonnegative().nullable().default(null),
  priceSnapshotCurrency: z.string().length(3).nullable().default(null),
  availabilitySnapshot: z.boolean().nullable().default(null),
  syncedAt: z.string().datetime().nullable().default(null),
});

export const ItemSchema = z.object({
  id: z.string().uuid(),
  venueId: z.string().uuid(),
  type: ItemTypeSchema,
  menuSectionId: z.string().uuid().nullable().default(null),
  name: z.string().trim().min(1),
  styleOrCategory: z.string().trim().nullable().default(null),
  abv: z.number().min(0).max(100).nullable().default(null),
  producerName: z.string().trim().nullable().default(null),
  producerLocation: z.string().trim().nullable().default(null),
  description: z.string().trim().nullable().default(null),
  imageUrl: z.string().url().nullable().default(null),
  active: z.boolean().default(true),
  status: ItemStatusSchema.default("active"),
  displayOrder: z.number().int().default(0),
  priceSource: PriceSourceSchema.default("unpriced"),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const MenuSectionSchema = z.object({
  id: z.string().uuid(),
  venueId: z.string().uuid(),
  itemType: ItemTypeSchema,
  name: z.string().trim().min(1),
  description: z.string().trim().nullable().default(null),
  active: z.boolean().default(true),
  displayOrder: z.number().int().default(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const ItemServingExternalLinkSchema = z.object({
  id: z.string().uuid(),
  itemServingId: z.string().uuid(),
  provider: z.enum(["square"]),
  externalId: z.string().min(1),
  priceSnapshotCents: z.number().int().nonnegative().nullable().default(null),
  priceSnapshotCurrency: z.string().length(3).nullable().default(null),
  availabilitySnapshot: z.boolean().nullable().default(null),
  syncedAt: z.string().datetime().nullable().default(null),
});

export const ItemServingSchema = z.object({
  id: z.string().uuid(),
  itemId: z.string().uuid(),
  venueId: z.string().uuid(),
  label: z.string().trim().min(1),
  sizeOz: z.number().positive().nullable().default(null),
  glassware: z.string().trim().nullable().default(null),
  priceCents: z.number().int().nonnegative().nullable().default(null),
  currency: z.string().length(3).default("USD"),
  active: z.boolean().default(true),
  displayOrder: z.number().int().default(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Item = z.infer<typeof ItemSchema>;
export type ItemExternalLink = z.infer<typeof ItemExternalLinkSchema>;
export type ItemServing = z.infer<typeof ItemServingSchema>;
export type ItemServingExternalLink = z.infer<typeof ItemServingExternalLinkSchema>;
export type ItemStatus = z.infer<typeof ItemStatusSchema>;
export type ItemType = z.infer<typeof ItemTypeSchema>;
export type MenuSection = z.infer<typeof MenuSectionSchema>;
export type PriceSource = z.infer<typeof PriceSourceSchema>;

export function formatAbv(abv: number | null | undefined) {
  if (abv === null || abv === undefined) {
    return null;
  }

  return `${abv.toFixed(1)}% ABV`;
}

export function resolveDisplayedPrice(
  item: Pick<Item, "priceSource">,
  link?: Pick<ItemExternalLink, "priceSnapshotCents" | "priceSnapshotCurrency"> | null,
) {
  if (item.priceSource === "manual") {
    return "Managed in TaproomOS";
  }

  if (item.priceSource === "square" && link?.priceSnapshotCents !== null && link?.priceSnapshotCents !== undefined) {
    const amount = link.priceSnapshotCents / 100;
    const currency = link.priceSnapshotCurrency ?? "USD";

    return new Intl.NumberFormat("en-US", {
      currency,
      style: "currency",
    }).format(amount);
  }

  return null;
}

export function isPublicItemStatus(status: ItemStatus | null | undefined) {
  return status === "active" || status === "coming_soon";
}

export function formatServingPrice(
  serving: Pick<ItemServing, "currency" | "priceCents">,
  link?: Pick<ItemServingExternalLink, "priceSnapshotCents" | "priceSnapshotCurrency"> | null,
) {
  const priceCents = link?.priceSnapshotCents ?? serving.priceCents;
  const currency = link?.priceSnapshotCurrency ?? serving.currency ?? "USD";

  if (priceCents === null || priceCents === undefined) {
    return null;
  }

  return new Intl.NumberFormat("en-US", {
    currency,
    style: "currency",
  }).format(priceCents / 100);
}

export function formatServingDetails(
  serving: Pick<ItemServing, "currency" | "glassware" | "label" | "priceCents" | "sizeOz">,
  link?: Pick<ItemServingExternalLink, "priceSnapshotCents" | "priceSnapshotCurrency"> | null,
) {
  const size = serving.sizeOz === null || serving.sizeOz === undefined ? null : `${formatOunces(serving.sizeOz)} oz`;
  const price = formatServingPrice(serving, link);

  return [size, serving.glassware, price].filter(Boolean).join(" · ") || serving.label;
}

function formatOunces(value: number) {
  return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);
}

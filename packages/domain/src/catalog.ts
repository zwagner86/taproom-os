import { z } from "zod";

export const itemTypes = ["pour", "food", "merch", "event"] as const;
export const priceSources = ["unpriced", "manual", "square"] as const;

export const ItemTypeSchema = z.enum(itemTypes);
export const PriceSourceSchema = z.enum(priceSources);

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
  name: z.string().trim().min(1),
  styleOrCategory: z.string().trim().nullable().default(null),
  abv: z.number().min(0).max(100).nullable().default(null),
  description: z.string().trim().nullable().default(null),
  imageUrl: z.string().url().nullable().default(null),
  active: z.boolean().default(true),
  displayOrder: z.number().int().default(0),
  priceSource: PriceSourceSchema.default("unpriced"),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Item = z.infer<typeof ItemSchema>;
export type ItemExternalLink = z.infer<typeof ItemExternalLinkSchema>;
export type ItemType = z.infer<typeof ItemTypeSchema>;
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


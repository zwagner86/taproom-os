import { formatAbv, resolveDisplayedPrice } from "@taproom/domain";
import { Badge, Card } from "@taproom/ui";

import type { Database } from "../../../../supabase/types";

type ItemRecord = Database["public"]["Tables"]["items"]["Row"] & {
  item_external_links: Database["public"]["Tables"]["item_external_links"]["Row"][];
};

export function PublicItemList({ items }: { items: ItemRecord[] }) {
  return (
    <div className="grid gap-4">
      {items.map((item) => {
        const linkedPrice = item.item_external_links[0];
        const price = resolveDisplayedPrice(
          {
            priceSource: item.price_source,
          },
          linkedPrice
            ? {
                priceSnapshotCents: linkedPrice.price_snapshot_cents,
                priceSnapshotCurrency: linkedPrice.price_snapshot_currency,
              }
            : null,
        );

        return (
          <Card className="space-y-4" key={item.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-2xl text-ink">{item.name}</h3>
                  <Badge>{item.type}</Badge>
                </div>
                <p className="text-sm text-ink/55">
                  {[item.style_or_category, formatAbv(item.abv)].filter(Boolean).join(" · ") || "Rotating feature"}
                </p>
              </div>
              {price ? <p className="text-sm font-semibold text-ink/60">{price}</p> : null}
            </div>
            {item.description ? <p className="text-sm leading-6 text-ink/70">{item.description}</p> : null}
          </Card>
        );
      })}
    </div>
  );
}


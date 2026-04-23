import { formatAbv, resolveDisplayedPrice } from "@taproom/domain";

import { Badge, Card } from "@/components/ui";

import type { Database } from "../../../../supabase/types";

type ItemRecord = Database["public"]["Tables"]["items"]["Row"] & {
  item_external_links: Database["public"]["Tables"]["item_external_links"]["Row"][];
};

type ItemType = "pour" | "food" | "merch" | "event";

const TYPE_EMOJI: Record<string, string> = { pour: "🍺", food: "🥨", merch: "👕", event: "🎟" };

const GROUP_ORDER: ItemType[] = ["pour", "food", "merch", "event"];
const GROUP_LABELS: Record<ItemType, string> = {
  pour: "Pours",
  food: "Food",
  merch: "Merch",
  event: "Events",
};

export function PublicItemList({ items, emptyMessage }: { items: ItemRecord[]; emptyMessage?: string }) {
  if (items.length === 0) {
    return (
      <Card className="border-dashed text-center shadow-none">
        <div className="mb-2 text-[32px]">🍺</div>
        <p className="text-sm leading-7 text-muted-foreground">
          {emptyMessage ?? "Nothing on tap right now — check back soon."}
        </p>
      </Card>
    );
  }

  const groups = GROUP_ORDER
    .map((type) => ({ items: items.filter((item) => item.type === type), type }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <Card className="overflow-hidden border-border/80 bg-white/92" key={group.type} style={{ padding: 0 }}>
          <div className="flex items-center justify-between border-b border-border/70 px-5 py-3.5">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {GROUP_LABELS[group.type]}
            </div>
            <Badge variant="default">{group.items.length}</Badge>
          </div>

          <div className="divide-y divide-border/70 px-5">
            {group.items.map((item) => {
              const linkedPrice = item.item_external_links[0];
              const price = resolveDisplayedPrice(
                { priceSource: item.price_source },
                linkedPrice
                  ? {
                      priceSnapshotCents: linkedPrice.price_snapshot_cents,
                      priceSnapshotCurrency: linkedPrice.price_snapshot_currency,
                    }
                  : null,
              );

              return (
                <div className="flex items-start justify-between gap-4 py-4" key={item.id}>
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="mt-0.5 text-[20px]">{TYPE_EMOJI[item.type] ?? "•"}</div>
                    <div className="min-w-0">
                      <div className="text-base font-semibold text-foreground">{item.name}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {[item.style_or_category, formatAbv(item.abv)].filter(Boolean).join(" · ") || "Rotating feature"}
                      </div>
                      {item.description && (
                        <div className="mt-2 text-sm leading-7 text-muted-foreground">{item.description}</div>
                      )}
                    </div>
                  </div>
                  {price && <div className="shrink-0 text-sm font-semibold text-foreground">{price}</div>}
                </div>
              );
            })}
          </div>
        </Card>
      ))}
    </div>
  );
}

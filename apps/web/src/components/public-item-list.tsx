import { formatAbv, resolveDisplayedPrice } from "@taproom/domain";
import { Badge } from "@taproom/ui";

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
      <div
        className="rounded-xl border px-5 py-10 text-center"
        style={{ borderColor: "var(--c-border)" }}
      >
        <div className="text-[32px] mb-2">🍺</div>
        <p className="text-[14px]" style={{ color: "var(--c-muted)" }}>{emptyMessage ?? "Nothing on tap right now — check back soon."}</p>
      </div>
    );
  }

  const groups = GROUP_ORDER
    .map((type) => ({ items: items.filter((i) => i.type === type), type }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="flex flex-col">
      {groups.map((group, gi) => (
        <div className={gi > 0 ? "mt-4" : ""} key={group.type}>
          {/* Section header */}
          <div
            className="text-[11px] font-bold uppercase tracking-[0.9px] py-2 border-b"
            style={{ color: "var(--c-muted)", borderColor: "var(--c-border)" }}
          >
            {GROUP_LABELS[group.type]}
          </div>

          {/* Items */}
          <div className="flex flex-col divide-y" style={{ borderColor: "var(--c-border)" }}>
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
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-4 py-4"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-0.5 text-[20px] flex-shrink-0">{TYPE_EMOJI[item.type] ?? "•"}</div>
                    <div>
                      <div className="font-semibold text-[15px]" style={{ color: "var(--c-text)" }}>
                        {item.name}
                      </div>
                      <div className="text-[13px] mt-0.5" style={{ color: "var(--c-muted)" }}>
                        {[item.style_or_category, formatAbv(item.abv)].filter(Boolean).join(" · ") || "Rotating feature"}
                      </div>
                      {item.description && (
                        <div className="text-[13px] mt-1.5 leading-relaxed" style={{ color: "var(--c-muted)" }}>
                          {item.description}
                        </div>
                      )}
                    </div>
                  </div>
                  {price && (
                    <div className="flex-shrink-0 font-semibold text-[14px]" style={{ color: "var(--c-text)" }}>
                      {price}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

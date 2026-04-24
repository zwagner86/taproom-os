"use client";

import { Beer, Package, Utensils } from "lucide-react";
import type { ReactNode } from "react";

import { Badge, Button, Card, DataTable, EmptyState } from "@/components/ui";
import { ITEM_SECTION_CONFIG_BY_TYPE, type CatalogItemType } from "@/lib/item-management";

export type ItemManagementRecord = {
  abv: number | null;
  active: boolean;
  description: string | null;
  id: string;
  name: string;
  style_or_category: string | null;
  type: CatalogItemType;
};

export function ItemManagementSection({
  actionRenderer,
  items,
  renderActions,
  type,
}: {
  actionRenderer: ReactNode;
  items: ItemManagementRecord[];
  renderActions: (item: ItemManagementRecord) => ReactNode;
  type: CatalogItemType;
}) {
  const config = ITEM_SECTION_CONFIG_BY_TYPE[type];
  const activeCount = items.filter((item) => item.active).length;

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-[-0.01em]" style={{ color: "var(--c-text)" }}>
              {config.label}
            </h2>
            <Badge variant={activeCount > 0 ? "success" : "default"}>{activeCount} active</Badge>
          </div>
          <p className="mt-1 max-w-2xl text-sm leading-6" style={{ color: "var(--c-muted)" }}>
            {config.description}
          </p>
        </div>
        {actionRenderer}
      </div>

      {items.length === 0 ? (
        <Card>
          <EmptyState
            className="py-8"
            description={config.emptyDescription}
            icon={ITEM_SECTION_ICONS[type]}
            title={`No ${config.label.toLowerCase()} yet`}
          />
        </Card>
      ) : (
        <DataTable
          className="mb-5"
          columns={[
            {
              key: "item",
              label: "Item",
              render: (item) => (
                <div className="flex items-center gap-2.5">
                  <span style={{ fontSize: 16 }}>{ITEM_TYPE_EMOJI[item.type]}</span>
                  <div>
                    <div className="font-semibold" style={{ color: item.active ? "var(--c-text)" : "var(--c-muted)" }}>
                      {item.name}
                    </div>
                    {item.description && (
                      <div className="text-[11.5px] mt-px truncate max-w-[240px]" style={{ color: "var(--c-muted)" }}>
                        {item.description}
                      </div>
                    )}
                  </div>
                </div>
              ),
            },
            {
              key: "abv",
              label: type === "pour" ? "ABV / Style" : "Category",
              render: (item) => (
                <span style={{ color: "var(--c-muted)", fontSize: 13 }}>
                  {[item.style_or_category, item.abv ? `${item.abv}% ABV` : null].filter(Boolean).join(" · ") || "-"}
                </span>
              ),
            },
            {
              key: "status",
              label: "Status",
              render: (item) => (
                <Badge variant={item.active ? "success" : "default"}>{item.active ? "Active" : "Hidden"}</Badge>
              ),
            },
            {
              key: "actions",
              label: "Actions",
              render: renderActions,
            },
          ]}
          keyExtractor={(item) => item.id}
          rows={items}
          striped
        />
      )}
    </section>
  );
}

const ITEM_TYPE_EMOJI: Record<CatalogItemType, string> = {
  food: "🥨",
  merch: "👕",
  pour: "🍺",
};

const ITEM_SECTION_ICONS: Record<CatalogItemType, ReactNode> = {
  food: <Utensils className="h-8 w-8 text-muted" />,
  merch: <Package className="h-8 w-8 text-muted" />,
  pour: <Beer className="h-8 w-8 text-muted" />,
};

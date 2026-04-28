"use client";

import { Beer, Package, Utensils } from "lucide-react";
import type { ReactNode } from "react";

import { Badge, Button, Card, DataTable, EmptyState } from "@/components/ui";
import { DEFAULT_MENU_SECTION_NAMES, ITEM_STATUS_LABELS, type CatalogItemStatus, type CatalogItemType } from "@/lib/item-management";

export type ItemManagementRecord = {
  abv: number | null;
  description: string | null;
  id: string;
  item_servings?: Array<{
    active: boolean;
    glassware: string | null;
    label: string;
    price_cents: number | null;
    size_oz: number | null;
  }>;
  menu_section_id: string | null;
  name: string;
  producer_location: string | null;
  producer_name: string | null;
  status: CatalogItemStatus;
  style_or_category: string | null;
  type: CatalogItemType;
};

export type ItemManagementMenuSection = {
  active: boolean;
  description: string | null;
  id: string;
  item_type: CatalogItemType;
  name: string;
};

export function ItemManagementSection({
  actionRenderer,
  items,
  renderActions,
  section,
}: {
  actionRenderer: ReactNode;
  items: ItemManagementRecord[];
  renderActions: (item: ItemManagementRecord) => ReactNode;
  section: ItemManagementMenuSection;
}) {
  const activeCount = items.filter((item) => item.status === "active").length;
  const visibleCount = items.filter((item) => item.status !== "hidden").length;

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-[-0.01em]" style={{ color: "var(--c-text)" }}>
              {section.name}
            </h2>
            <Badge variant={visibleCount > 0 ? "success" : "default"}>{visibleCount} visible</Badge>
            {!section.active && <Badge variant="default">Section hidden</Badge>}
          </div>
          <p className="mt-1 max-w-2xl text-sm leading-6" style={{ color: "var(--c-muted)" }}>
            {section.description ?? `${DEFAULT_MENU_SECTION_NAMES[section.item_type]} assigned to this menu section.`}
          </p>
        </div>
        {actionRenderer}
      </div>

      {items.length === 0 ? (
        <Card>
          <EmptyState
            className="py-8"
            description="Add the first item for this menu section."
            icon={ITEM_SECTION_ICONS[section.item_type]}
            title={`No ${section.name.toLowerCase()} yet`}
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
                    <div className="font-semibold" style={{ color: item.status !== "hidden" ? "var(--c-text)" : "var(--c-muted)" }}>
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
              label: section.item_type === "pour" ? "Details" : "Category",
              render: (item) => (
                <span style={{ color: "var(--c-muted)", fontSize: 13 }}>
                  {[
                    item.style_or_category,
                    item.abv ? `${item.abv}% ABV` : null,
                    item.producer_name,
                    item.producer_location,
                  ].filter(Boolean).join(" · ") || "-"}
                </span>
              ),
            },
            {
              key: "servings",
              label: "Servings",
              render: (item) => (
                <span style={{ color: "var(--c-muted)", fontSize: 13 }}>
                  {(item.item_servings ?? [])
                    .filter((serving) => serving.active)
                    .map((serving) => [serving.size_oz ? `${serving.size_oz} oz` : serving.label, serving.glassware].filter(Boolean).join(" "))
                    .join(" · ") || "-"}
                </span>
              ),
            },
            {
              key: "status",
              label: "Status",
              render: (item) => (
                <Badge variant={item.status === "active" ? "success" : item.status === "coming_soon" ? "info" : "default"}>
                  {ITEM_STATUS_LABELS[item.status]}
                </Badge>
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

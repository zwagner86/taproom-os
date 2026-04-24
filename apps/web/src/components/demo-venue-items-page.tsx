"use client";

import { useEffect, useMemo, useState } from "react";

import { Beer } from "lucide-react";

import { DemoMutationAlert } from "@/components/demo-mutation-alert";
import { useDemoVenue } from "@/components/demo-venue-provider";
import { ItemActiveToggle } from "@/components/item-active-toggle";
import { ItemTypeForm } from "@/components/item-type-form";
import { Alert, Badge, Button, Card, DataTable, EmptyState, PageHeader } from "@/components/ui";
import type { DemoItemRecord } from "@/lib/demo-venue-state";
import type { VenueRow } from "@/server/repositories/venues";

const TYPE_EMOJI: Record<string, string> = { pour: "🍺", food: "🥨", merch: "👕", event: "🎟" };
const TYPE_LABELS: Record<string, string> = { pour: "Pour", food: "Food", merch: "Merch", event: "Event" };

export function DemoVenueItemsPage({
  initialError,
  initialItems,
  initialVenue,
}: {
  initialError?: string;
  initialItems: DemoItemRecord[];
  initialVenue: VenueRow;
}) {
  const { createItem, deleteItem, dispatchSeedItems, state, toggleItemActive } = useDemoVenue();
  const items = state.items ?? initialItems;
  const venue = state.venue ?? initialVenue;
  const activeCount = useMemo(() => items.filter((item) => item.active).length, [items]);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [formKey, setFormKey] = useState(0);
  const [result, setResult] = useState<ReturnType<typeof createItem> | null>(null);

  useEffect(() => {
    dispatchSeedItems(initialItems);
  }, [dispatchSeedItems, initialItems]);

  const createAction = async (formData: FormData) => {
    try {
      setError(null);
      setResult(createItem(formData));
      setFormKey((current) => current + 1);
    } catch (nextError) {
      setResult(null);
      setError(nextError instanceof Error ? nextError.message : "Unable to create item.");
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      setError(null);
      setResult(deleteItem(itemId));
    } catch (nextError) {
      setResult(null);
      setError(nextError instanceof Error ? nextError.message : "Unable to remove item.");
    }
  };

  return (
    <div>
      <PageHeader title="Item Management" subtitle={`${venue.menu_label} — ${activeCount} active items`} />

      <div className="mb-5 space-y-4">
        <DemoMutationAlert onDismiss={() => setResult(null)} result={result} />
        {error && (
          <Alert onDismiss={() => setError(null)} variant="error">
            {error}
          </Alert>
        )}
      </div>

      {items.length > 0 && (
        <DataTable
          className="mb-5"
          columns={[
            {
              key: "item",
              label: "Item",
              render: (item) => (
                <div className="flex items-center gap-2.5">
                  <span style={{ fontSize: 16 }}>{TYPE_EMOJI[item.type] ?? "•"}</span>
                  <div>
                    <div className="font-semibold" style={{ color: item.active ? "var(--c-text)" : "var(--c-muted)" }}>
                      {item.name}
                    </div>
                    {item.description && (
                      <div className="text-[11.5px] mt-px truncate max-w-[200px]" style={{ color: "var(--c-muted)" }}>
                        {item.description}
                      </div>
                    )}
                  </div>
                </div>
              ),
            },
            {
              key: "type",
              label: "Type",
              render: (item) => <Badge variant="info">{TYPE_LABELS[item.type] ?? item.type}</Badge>,
            },
            {
              key: "abv",
              label: "ABV / Category",
              render: (item) => (
                <span style={{ color: "var(--c-muted)", fontSize: 13 }}>
                  {[item.style_or_category, item.abv ? `${item.abv}% ABV` : null].filter(Boolean).join(" · ") || "—"}
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
              render: (item) => (
                <div className="flex items-center gap-2">
                  <ItemActiveToggle
                    action={async (active) => {
                      try {
                        setError(null);
                        setResult(toggleItemActive(item.id, active));
                      } catch (nextError) {
                        setResult(null);
                        setError(nextError instanceof Error ? nextError.message : "Unable to update item.");
                      }
                    }}
                    active={item.active}
                  />
                  <Button
                    onClick={() => void handleDelete(item.id)}
                    size="sm"
                    type="button"
                    variant="ghost"
                    style={{ color: "var(--c-muted)" }}
                  >
                    Del
                  </Button>
                </div>
              ),
            },
          ]}
          keyExtractor={(item) => item.id}
          rows={items}
          striped
        />
      )}

      {items.length === 0 && (
        <EmptyState
          className="mb-5"
          description="Add your first tap, food item, or merch below."
          icon={<Beer className="w-9 h-9 text-muted" />}
          title="No items"
        />
      )}

      <Card>
        <div className="text-sm font-semibold mb-4" style={{ color: "var(--c-text)" }}>Add item</div>
        <ItemTypeForm action={createAction} key={formKey} submitLabel="+ Add item" />
      </Card>
    </div>
  );
}

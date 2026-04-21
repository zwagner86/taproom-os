export const dynamic = "force-dynamic";

import { Alert, Badge, Button, Card, DataTable, EmptyState, PageHeader } from "@taproom/ui";

import { Beer } from "lucide-react";

import { AddItemForm } from "@/components/add-item-form";
import { ItemActiveToggle } from "@/components/item-active-toggle";
import { createItemAction, deleteItemAction, toggleItemActiveAction } from "@/server/actions/items";
import { listVenueItems } from "@/server/repositories/items";
import { requireVenueAccess } from "@/server/repositories/venues";

const TYPE_EMOJI: Record<string, string> = { pour: "🍺", food: "🥨", merch: "👕", event: "🎟" };
const TYPE_LABELS: Record<string, string> = { pour: "Pour", food: "Food", merch: "Merch", event: "Event" };

export default async function VenueItemsPage({
  params,
  searchParams,
}: {
  params: Promise<{ venue: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { venue } = await params;
  const [{ venue: venueRecord }, { error, message }] = await Promise.all([
    requireVenueAccess(venue),
    searchParams,
  ]);
  const items = await listVenueItems(venueRecord.id);
  const activeCount = items.filter((i) => i.active).length;

  const createAction = createItemAction.bind(null, venue);
  const deleteAction = deleteItemAction.bind(null, venue);

  return (
    <div>
      <PageHeader title="Item Management" subtitle={`${venueRecord.menu_label} — ${activeCount} active items`} />

      {message && <Alert variant="success" className="mb-5">{message}</Alert>}
      {error && <Alert variant="error" className="mb-5">{error}</Alert>}

      {items.length > 0 && (
        <DataTable
          rows={items}
          keyExtractor={(item) => item.id}
          striped
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
              render: (item) => {
                const toggleAction = toggleItemActiveAction.bind(null, venue, item.id);
                return (
                  <div className="flex items-center gap-2">
                    <ItemActiveToggle active={item.active} action={toggleAction} />
                    <form action={deleteAction}>
                      <input name="item_id" type="hidden" value={item.id} />
                      <Button size="sm" type="submit" variant="ghost" style={{ color: "var(--c-muted)" }}>
                        Del
                      </Button>
                    </form>
                  </div>
                );
              },
            },
          ]}
        />
      )}

      {items.length === 0 && (
        <EmptyState
          icon={<Beer className="w-9 h-9 text-muted" />}
          title="No items"
          description="Add your first tap, food item, or merch below."
          className="mb-5"
        />
      )}

      <Card>
        <div className="text-sm font-semibold mb-4" style={{ color: "var(--c-text)" }}>Add item</div>
        <AddItemForm action={createAction} />
      </Card>
    </div>
  );
}

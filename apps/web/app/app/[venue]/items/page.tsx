export const dynamic = "force-dynamic";

import { Badge, Button, Card, Input, Label, Select, Textarea } from "@taproom/ui";

import { createItemAction, deleteItemAction, updateItemAction } from "@/server/actions/items";
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
  const updateAction = updateItemAction.bind(null, venue);
  const deleteAction = deleteItemAction.bind(null, venue);

  return (
    <div>
      {/* Page header */}
      <div className="flex items-start justify-between mb-7 gap-4">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.5px] mb-1" style={{ color: "var(--c-text)" }}>
            Item Management
          </h1>
          <p className="text-[13.5px]" style={{ color: "var(--c-muted)" }}>
            {venueRecord.menu_label} — {activeCount} active items
          </p>
        </div>
      </div>

      {message && (
        <div className="mb-5 rounded-[10px] border border-green-200 bg-green-50 px-4 py-3 text-[13px] text-green-800">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-5 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
          {error}
        </div>
      )}

      {/* Items list */}
      {items.length > 0 && (
        <Card style={{ padding: 0, marginBottom: 20 }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
              <thead>
                <tr style={{ borderBottom: "1.5px solid var(--c-border)" }}>
                  {["Item", "Type", "ABV / Category", "Status", "Actions"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 12px",
                        textAlign: "left",
                        fontWeight: 600,
                        color: "var(--c-muted)",
                        fontSize: 12,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: i < items.length - 1 ? "1px solid var(--c-border)" : "none",
                      background: i % 2 !== 0 ? "oklch(98.5% 0.004 75)" : "transparent",
                    }}
                  >
                    <td style={{ padding: "11px 12px", verticalAlign: "middle" }}>
                      <div className="flex items-center gap-2.5">
                        <span style={{ fontSize: 16 }}>{TYPE_EMOJI[item.type] ?? "•"}</span>
                        <div>
                          <div
                            className="font-semibold"
                            style={{ color: item.active ? "var(--c-text)" : "var(--c-muted)" }}
                          >
                            {item.name}
                          </div>
                          {item.description && (
                            <div
                              className="text-[11.5px] mt-px truncate max-w-[200px]"
                              style={{ color: "var(--c-muted)" }}
                            >
                              {item.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "11px 12px", verticalAlign: "middle" }}>
                      <Badge variant="info">{TYPE_LABELS[item.type] ?? item.type}</Badge>
                    </td>
                    <td style={{ padding: "11px 12px", verticalAlign: "middle", color: "var(--c-muted)", fontSize: 13 }}>
                      {[item.style_or_category, item.abv ? `${item.abv}% ABV` : null].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td style={{ padding: "11px 12px", verticalAlign: "middle" }}>
                      <Badge variant={item.active ? "success" : "default"}>
                        {item.active ? "Active" : "Hidden"}
                      </Badge>
                    </td>
                    <td style={{ padding: "11px 12px", verticalAlign: "middle" }}>
                      <div className="flex gap-1.5">
                        <form action={updateAction}>
                          <input name="item_id" type="hidden" value={item.id} />
                          <input name="name" type="hidden" value={item.name} />
                          <input name="type" type="hidden" value={item.type} />
                          <input name="active" type="hidden" value={item.active ? "" : "on"} />
                          <Button size="sm" type="submit" variant={item.active ? "secondary" : "success"}>
                            {item.active ? "Hide" : "Show"}
                          </Button>
                        </form>
                        <form action={deleteAction}>
                          <input name="item_id" type="hidden" value={item.id} />
                          <Button size="sm" type="submit" variant="ghost" style={{ color: "var(--c-muted)" }}>
                            Del
                          </Button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {items.length === 0 && (
        <Card style={{ marginBottom: 20 }}>
          <div
            className="flex flex-col items-center justify-center py-16 gap-3 text-center"
          >
            <div style={{ fontSize: 36 }}>🍺</div>
            <div className="font-semibold text-[15px]" style={{ color: "var(--c-text)" }}>No items</div>
            <div className="text-[13.5px] max-w-xs leading-relaxed" style={{ color: "var(--c-muted)" }}>
              Add your first tap, food item, or merch below.
            </div>
          </div>
        </Card>
      )}

      {/* Add item form */}
      <Card>
        <div className="text-sm font-semibold mb-4" style={{ color: "var(--c-text)" }}>Add item</div>
        <form action={createAction} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="create-name">Name <span style={{ color: "var(--accent)" }}>*</span></Label>
              <Input id="create-name" name="name" placeholder="Ironwood IPA" required />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="create-type">Type</Label>
              <Select defaultValue="pour" id="create-type" name="type">
                <option value="pour">Pour</option>
                <option value="food">Food</option>
                <option value="merch">Merch</option>
                <option value="event">Event listing</option>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="create-style">Style / Category</Label>
              <Input id="create-style" name="style_or_category" placeholder="IPA, Stout…" />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="create-abv">ABV (%)</Label>
              <Input id="create-abv" name="abv" placeholder="6.7" step="0.1" type="number" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="create-description">Description</Label>
            <Textarea id="create-description" name="description" placeholder="Short tasting note or menu copy" rows={2} />
          </div>
          <div className="flex gap-2 mt-1">
            <Button type="submit">+ Add item</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

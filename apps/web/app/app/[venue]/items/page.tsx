export const dynamic = "force-dynamic";

import { Button, Card, Input, Label, Select, Textarea } from "@taproom/ui";

import { createItemAction, deleteItemAction, updateItemAction } from "@/server/actions/items";
import { listVenueItems } from "@/server/repositories/items";
import { requireVenueAccess } from "@/server/repositories/venues";

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

  const createAction = createItemAction.bind(null, venue);
  const updateAction = updateItemAction.bind(null, venue);
  const deleteAction = deleteItemAction.bind(null, venue);

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Unified item model</p>
          <h1 className="font-display text-4xl text-ink">{venueRecord.menu_label}</h1>
          <p className="max-w-2xl text-sm leading-6 text-ink/65">
            Update once here and the same content flows to public menu pages, embeds, and the venue TV screen.
          </p>
        </div>
        {message ? <p className="rounded-3xl bg-pine/10 px-4 py-3 text-sm text-pine">{message}</p> : null}
        {error ? <p className="rounded-3xl bg-ember/10 px-4 py-3 text-sm text-ember">{error}</p> : null}
      </Card>

      <Card>
        <form action={createAction} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="create-name">Item name</Label>
            <Input id="create-name" name="name" placeholder="Foamline IPA" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-type">Type</Label>
            <Select defaultValue="pour" id="create-type" name="type">
              <option value="pour">Pour</option>
              <option value="food">Food</option>
              <option value="merch">Merch</option>
              <option value="event">Event listing</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-style">Style or category</Label>
            <Input id="create-style" name="style_or_category" placeholder="West Coast IPA" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-abv">ABV</Label>
            <Input id="create-abv" name="abv" placeholder="6.7" step="0.1" type="number" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-order">Display order</Label>
            <Input defaultValue="0" id="create-order" name="display_order" type="number" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="create-image">Image URL</Label>
            <Input id="create-image" name="image_url" placeholder="https://..." type="url" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="create-description">Description</Label>
            <Textarea id="create-description" name="description" placeholder="Short tasting note or menu copy" />
          </div>
          <div className="md:col-span-2">
            <Button type="submit">Add item</Button>
          </div>
        </form>
      </Card>

      <section className="grid gap-4">
        {items.map((item) => (
          <Card className="space-y-4" key={item.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">{item.type}</p>
                <h2 className="font-display text-2xl text-ink">{item.name}</h2>
              </div>
              <p className="text-sm text-ink/55">{item.active ? "Active" : "Hidden"}</p>
            </div>

            <form action={updateAction} className="grid gap-4 md:grid-cols-2">
              <input name="item_id" type="hidden" value={item.id} />
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor={`name-${item.id}`}>Name</Label>
                <Input defaultValue={item.name} id={`name-${item.id}`} name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`type-${item.id}`}>Type</Label>
                <Select defaultValue={item.type} id={`type-${item.id}`} name="type">
                  <option value="pour">Pour</option>
                  <option value="food">Food</option>
                  <option value="merch">Merch</option>
                  <option value="event">Event listing</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`style-${item.id}`}>Style or category</Label>
                <Input defaultValue={item.style_or_category ?? ""} id={`style-${item.id}`} name="style_or_category" />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`abv-${item.id}`}>ABV</Label>
                <Input defaultValue={item.abv ?? ""} id={`abv-${item.id}`} name="abv" step="0.1" type="number" />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`order-${item.id}`}>Display order</Label>
                <Input defaultValue={item.display_order} id={`order-${item.id}`} name="display_order" type="number" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor={`image-${item.id}`}>Image URL</Label>
                <Input defaultValue={item.image_url ?? ""} id={`image-${item.id}`} name="image_url" type="url" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor={`description-${item.id}`}>Description</Label>
                <Textarea defaultValue={item.description ?? ""} id={`description-${item.id}`} name="description" />
              </div>
              <label className="inline-flex items-center gap-3 text-sm font-semibold text-ink/70">
                <input defaultChecked={item.active} name="active" type="checkbox" />
                Show on public surfaces
              </label>
              <div className="flex flex-wrap gap-3 md:col-span-2">
                <Button type="submit">Save item</Button>
              </div>
            </form>

            <form action={deleteAction}>
              <input name="item_id" type="hidden" value={item.id} />
              <Button type="submit" variant="ghost">
                Remove item
              </Button>
            </form>
          </Card>
        ))}

        {items.length === 0 ? (
          <Card>
            <p className="text-sm leading-6 text-ink/65">
              No items yet. Add your first pour, food item, merch record, or event placeholder above.
            </p>
          </Card>
        ) : null}
      </section>
    </div>
  );
}


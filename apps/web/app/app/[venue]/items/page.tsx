export const dynamic = "force-dynamic";

import { Alert, Button, PageHeader } from "@/components/ui";

import { AddItemDrawer } from "@/components/add-item-form";
import { DemoVenueItemsPage } from "@/components/demo-venue-items-page";
import { ItemActiveToggle } from "@/components/item-active-toggle";
import { ItemManagementSection } from "@/components/item-management-sections";
import { ITEM_SECTION_CONFIGS, groupCatalogItems } from "@/lib/item-management";
import { createItemAction, deleteItemAction, toggleItemActiveAction } from "@/server/actions/items";
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
  const [access, { error, message }] = await Promise.all([
    requireVenueAccess(venue),
    searchParams,
  ]);
  const { venue: venueRecord } = access;
  const items = await listVenueItems(venueRecord.id);
  const activeCount = items.filter((i) => i.active).length;
  const groupedItems = groupCatalogItems(items);

  if (access.isDemoVenue) {
    return <DemoVenueItemsPage initialItems={items} initialVenue={venueRecord} />;
  }

  const createAction = createItemAction.bind(null, venue);
  const deleteAction = deleteItemAction.bind(null, venue);

  return (
    <div>
      <PageHeader
        title="Item Management"
        subtitle={`${activeCount} active items across drinks, food, and merch`}
      />

      {message && <Alert variant="success" className="mb-5">{message}</Alert>}
      {error && <Alert variant="error" className="mb-5">{error}</Alert>}

      <div className="mt-6 space-y-8">
        {ITEM_SECTION_CONFIGS.map((section) => (
          <ItemManagementSection
            actionRenderer={
              <AddItemDrawer
                action={createAction}
                disabled={access.isDemoVenue}
                itemType={section.type}
                triggerLabel={section.newLabel}
              />
            }
            items={groupedItems[section.type]}
            key={section.type}
            renderActions={(item) => {
              const toggleAction = toggleItemActiveAction.bind(null, venue, item.id);
              return (
                <div className="flex items-center gap-2">
                  <ItemActiveToggle active={item.active} action={toggleAction} disabled={access.isDemoVenue} />
                  <form action={deleteAction}>
                    <input name="item_id" type="hidden" value={item.id} />
                    <Button
                      disabled={access.isDemoVenue}
                      size="sm"
                      type="submit"
                      variant="ghost"
                      style={{ color: "var(--c-muted)" }}
                    >
                      Del
                    </Button>
                  </form>
                </div>
              );
            }}
            type={section.type}
          />
        ))}
      </div>
    </div>
  );
}

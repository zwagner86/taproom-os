export const dynamic = "force-dynamic";

import { Alert, Button, PageHeader } from "@/components/ui";

import { AddItemDrawer } from "@/components/add-item-form";
import { AdminFormDrawer } from "@/components/admin-create-drawer";
import { DemoVenueItemsPage } from "@/components/demo-venue-items-page";
import { ItemManagementSection } from "@/components/item-management-sections";
import { ItemTypeForm } from "@/components/item-type-form";
import { MenuSectionCreateDrawer, MenuSectionEditDrawer, MenuSectionMoveButtons } from "@/components/menu-section-controls";
import {
  createItemAction,
  createMenuSectionAction,
  deleteItemAction,
  deleteMenuSectionAction,
  moveMenuSectionAction,
  updateItemAction,
  updateMenuSectionAction,
} from "@/server/actions/items";
import { listVenueItems, listVenueMenuSections } from "@/server/repositories/items";
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
  const [items, sections] = await Promise.all([
    listVenueItems(venueRecord.id),
    listVenueMenuSections(venueRecord.id),
  ]);
  const activeCount = items.filter((i) => i.status === "active").length;

  if (access.isDemoVenue) {
    return <DemoVenueItemsPage initialItems={items} initialVenue={venueRecord} />;
  }

  const createAction = createItemAction.bind(null, venue);
  const updateAction = updateItemAction.bind(null, venue);
  const deleteAction = deleteItemAction.bind(null, venue);
  const createSectionAction = createMenuSectionAction.bind(null, venue);
  const updateSectionAction = updateMenuSectionAction.bind(null, venue);
  const deleteSectionAction = deleteMenuSectionAction.bind(null, venue);
  const nextSectionOrder = sections.reduce((max, section) => Math.max(max, section.display_order), 0) + 10;

  return (
    <div>
      <PageHeader
        title="Menu Builder"
        subtitle={`${activeCount} published items across reusable menu sections`}
        actions={<MenuSectionCreateDrawer action={createSectionAction} nextOrder={nextSectionOrder} />}
      />

      {message && <Alert variant="success" className="mb-5">{message}</Alert>}
      {error && <Alert variant="error" className="mb-5">{error}</Alert>}

      <div className="mt-6 space-y-8">
        {sections.map((section, sectionIndex) => {
          const sectionItems = items.filter((item) => item.menu_section_id === section.id);
          return (
          <ItemManagementSection
            actionRenderer={
              <div className="flex flex-wrap items-center gap-2">
                <MenuSectionMoveButtons
                  disabledDown={sectionIndex === sections.length - 1}
                  disabledUp={sectionIndex === 0}
                  moveDownAction={moveMenuSectionAction.bind(null, venue, section.id, "down")}
                  moveUpAction={moveMenuSectionAction.bind(null, venue, section.id, "up")}
                />
                <MenuSectionEditDrawer
                  action={updateSectionAction}
                  deleteAction={deleteSectionAction}
                  section={section}
                />
                <AddItemDrawer
                  action={createAction}
                  disabled={access.isDemoVenue}
                  itemType={section.item_type}
                  sections={sections}
                  triggerLabel="New item"
                />
              </div>
            }
            items={sectionItems}
            key={section.id}
            renderActions={(item) => {
              return (
                <div className="flex items-center gap-2">
                  <AdminFormDrawer
                    description="Edit menu placement, serving details, producer metadata, and publication status."
                    title={`Edit ${item.name}`}
                    triggerIcon={null}
                    triggerLabel="Edit"
                    triggerSize="sm"
                    triggerVariant="secondary"
                  >
                    <ItemTypeForm
                      action={updateAction}
                      defaultValues={{
                        ...item,
                        servings: item.item_servings,
                      }}
                      sections={sections}
                      submitLabel="Save item"
                    />
                  </AdminFormDrawer>
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
            section={section}
          />
          );
        })}
      </div>
    </div>
  );
}

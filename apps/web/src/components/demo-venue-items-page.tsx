"use client";

import { useEffect, useMemo, useState } from "react";

import { AdminCreateDrawer } from "@/components/admin-create-drawer";
import { DemoMutationAlert } from "@/components/demo-mutation-alert";
import { useDemoVenue } from "@/components/demo-venue-provider";
import { ItemActiveToggle } from "@/components/item-active-toggle";
import { ItemManagementSection } from "@/components/item-management-sections";
import { ItemTypeForm } from "@/components/item-type-form";
import { Alert, Button, PageHeader } from "@/components/ui";
import type { DemoItemRecord } from "@/lib/demo-venue-state";
import { ITEM_SECTION_CONFIGS, groupCatalogItems } from "@/lib/item-management";
import type { VenueRow } from "@/server/repositories/venues";

export function DemoVenueItemsPage({
  initialError,
  initialItems,
}: {
  initialError?: string;
  initialItems: DemoItemRecord[];
  initialVenue: VenueRow;
}) {
  const { createItem, deleteItem, dispatchSeedItems, state, toggleItemActive } = useDemoVenue();
  const items = state.items ?? initialItems;
  const activeCount = useMemo(() => items.filter((item) => item.status === "active" || item.active).length, [items]);
  const groupedItems = useMemo(() => groupCatalogItems(items), [items]);
  const demoSections = useMemo(
    () =>
      ITEM_SECTION_CONFIGS.map((section, index) => ({
        active: true,
        description: section.description,
        display_order: index * 10,
        id: `demo-section-${section.type}`,
        item_type: section.type,
        name: section.label,
        updated_at: "",
        created_at: "",
        venue_id: "",
      })),
    [],
  );
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [formKey, setFormKey] = useState(0);
  const [result, setResult] = useState<ReturnType<typeof createItem> | null>(null);

  useEffect(() => {
    dispatchSeedItems(initialItems);
  }, [dispatchSeedItems, initialItems]);

  const createAction = async (formData: FormData, onSuccess?: () => void) => {
    try {
      setError(null);
      setResult(createItem(formData));
      setFormKey((current) => current + 1);
      onSuccess?.();
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
      <PageHeader title="Menu Builder" subtitle={`${activeCount} published demo items across drinks, food, and merch`} />

      <div className="mb-5 space-y-4">
        <DemoMutationAlert onDismiss={() => setResult(null)} result={result} />
        {error && (
          <Alert onDismiss={() => setError(null)} variant="error">
            {error}
          </Alert>
        )}
      </div>

      <div className="mt-6 space-y-8">
        {ITEM_SECTION_CONFIGS.map((section, index) => (
          <ItemManagementSection
            actionRenderer={
              <AdminCreateDrawer
                description={`Create a ${section.singularLabel} item for this section.`}
                title={`New ${section.singularLabel}`}
                triggerLabel={section.newLabel}
              >
                {({ close }) => (
                  <ItemTypeForm
                    action={(formData) => createAction(formData, close)}
                    fixedType={section.type}
                    key={`${section.type}-${formKey}`}
                    sections={demoSections}
                    submitLabel={`Add ${section.singularLabel}`}
                  />
                )}
              </AdminCreateDrawer>
            }
            items={groupedItems[section.type]}
            key={demoSections[index]?.id ?? section.type}
            renderActions={(item) => (
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
                  active={item.status !== "hidden"}
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
            )}
            section={demoSections[index] ?? {
              active: true,
              description: section.description,
              id: section.type,
              item_type: section.type,
              name: section.label,
            }}
          />
        ))}
      </div>
    </div>
  );
}

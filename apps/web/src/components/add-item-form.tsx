"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";

import { Alert } from "@/components/ui";

import { AdminCreateDrawer } from "@/components/admin-create-drawer";
import { ItemTypeForm } from "@/components/item-type-form";
import type { CatalogItemType } from "@/lib/item-management";
import type { ItemFormState } from "@/server/actions/items";

export function AddItemForm({
  action,
  disabled = false,
  itemType,
  onSuccess,
  sections = [],
}: {
  action: (prevState: ItemFormState, formData: FormData) => Promise<ItemFormState>;
  disabled?: boolean;
  itemType?: CatalogItemType;
  onSuccess?: () => void;
  sections?: ComponentProps<typeof ItemTypeForm>["sections"];
}) {
  const [state, formAction] = useActionState(action, null);
  const [formKey, setFormKey] = useState(0);
  const previousState = useRef<ItemFormState>(null);

  useEffect(() => {
    if (state?.message && state !== previousState.current) {
      previousState.current = state;
      setFormKey((k) => k + 1);
      onSuccess?.();
    }
  }, [onSuccess, state?.message]);

  return (
    <>
      {state?.message && <Alert variant="success" className="mb-4">{state.message}</Alert>}
      {state?.error && <Alert variant="error" className="mb-4">{state.error}</Alert>}
      <ItemTypeForm
        key={formKey}
        action={formAction}
        disabled={disabled}
        fixedType={itemType}
        sections={sections}
        submitLabel={itemType ? `Add ${ITEM_TYPE_LABELS[itemType]}` : undefined}
      />
    </>
  );
}

export function AddItemDrawer({
  action,
  disabled = false,
  itemType,
  sections = [],
  triggerLabel,
}: {
  action: (prevState: ItemFormState, formData: FormData) => Promise<ItemFormState>;
  disabled?: boolean;
  itemType?: CatalogItemType;
  sections?: ComponentProps<typeof ItemTypeForm>["sections"];
  triggerLabel?: string;
}) {
  const router = useRouter();
  const resolvedTriggerLabel = triggerLabel ?? (itemType ? `New ${ITEM_TYPE_LABELS[itemType]}` : "New item");

  return (
    <AdminCreateDrawer
      description={
        itemType
          ? `Create a ${ITEM_TYPE_LABELS[itemType]} item for this section.`
          : "Create a tap, food item, or merch item."
      }
      title={itemType ? `New ${ITEM_TYPE_LABELS[itemType]}` : "New item"}
      triggerLabel={resolvedTriggerLabel}
    >
      {({ close }) => (
        <AddItemForm
          action={action}
          disabled={disabled}
          onSuccess={() => {
            close();
            router.refresh();
          }}
          itemType={itemType}
          sections={sections}
        />
      )}
    </AdminCreateDrawer>
  );
}

const ITEM_TYPE_LABELS: Record<CatalogItemType, string> = {
  food: "food",
  merch: "merch",
  pour: "pour",
};

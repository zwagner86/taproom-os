"use client";

import { ArrowDown, ArrowUp } from "lucide-react";

import { AdminFormDrawer } from "@/components/admin-create-drawer";
import { Button, FieldLabel, Input, Select, Textarea } from "@/components/ui";
import type { CatalogItemType } from "@/lib/item-management";

type SectionRecord = {
  active: boolean;
  description: string | null;
  display_order: number;
  id: string;
  item_type: CatalogItemType;
  name: string;
};

export function MenuSectionCreateDrawer({
  action,
  nextOrder,
}: {
  action: (formData: FormData) => void | Promise<void>;
  nextOrder: number;
}) {
  return (
    <AdminFormDrawer
      description="Create a reusable menu section for drinks, food, or merch."
      title="New section"
      triggerLabel="New section"
      triggerVariant="secondary"
    >
      <SectionForm action={action} defaultOrder={nextOrder} submitLabel="Create section" />
    </AdminFormDrawer>
  );
}

export function MenuSectionEditDrawer({
  action,
  deleteAction,
  section,
}: {
  action: (formData: FormData) => void | Promise<void>;
  deleteAction: (formData: FormData) => void | Promise<void>;
  section: SectionRecord;
}) {
  return (
    <AdminFormDrawer
      description="Rename, hide, or retarget this section."
      title={`Edit ${section.name}`}
      triggerIcon={null}
      triggerLabel="Edit section"
      triggerSize="sm"
      triggerVariant="secondary"
    >
      <div className="space-y-5">
        <SectionForm action={action} section={section} submitLabel="Save section" />
        <form action={deleteAction} className="border-t border-border pt-4">
          <input name="section_id" type="hidden" value={section.id} />
          <Button type="submit" variant="danger">Delete section</Button>
        </form>
      </div>
    </AdminFormDrawer>
  );
}

export function MenuSectionMoveButtons({
  disabledDown,
  disabledUp,
  moveDownAction,
  moveUpAction,
}: {
  disabledDown?: boolean;
  disabledUp?: boolean;
  moveDownAction: () => Promise<void>;
  moveUpAction: () => Promise<void>;
}) {
  return (
    <div className="flex items-center gap-1">
      <form action={moveUpAction}>
        <Button disabled={disabledUp} size="sm" type="submit" variant="ghost">
          <ArrowUp className="h-4 w-4" />
        </Button>
      </form>
      <form action={moveDownAction}>
        <Button disabled={disabledDown} size="sm" type="submit" variant="ghost">
          <ArrowDown className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

function SectionForm({
  action,
  defaultOrder,
  section,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaultOrder?: number;
  section?: SectionRecord;
  submitLabel: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-3">
      {section && <input name="section_id" type="hidden" value={section.id} />}
      <input name="display_order" type="hidden" value={section?.display_order ?? defaultOrder ?? 0} />
      <div className="grid gap-3 md:grid-cols-2">
        <div className="flex flex-col gap-1">
          <FieldLabel htmlFor={section ? `section-name-${section.id}` : "section-name"} required>Name</FieldLabel>
          <Input
            defaultValue={section?.name ?? ""}
            id={section ? `section-name-${section.id}` : "section-name"}
            name="name"
            placeholder="Seasonal Beers"
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <FieldLabel htmlFor={section ? `section-type-${section.id}` : "section-type"}>Type</FieldLabel>
          <Select
            defaultValue={section?.item_type ?? "pour"}
            id={section ? `section-type-${section.id}` : "section-type"}
            name="item_type"
          >
            <option value="pour">Drinks</option>
            <option value="food">Food</option>
            <option value="merch">Merch</option>
          </Select>
        </div>
      </div>
      {section && (
        <label className="flex items-center gap-2 text-sm">
          <input defaultChecked={section.active} name="active" type="checkbox" />
          Section is visible
        </label>
      )}
      <div className="flex flex-col gap-1">
        <FieldLabel htmlFor={section ? `section-description-${section.id}` : "section-description"}>Description</FieldLabel>
        <Textarea
          defaultValue={section?.description ?? ""}
          id={section ? `section-description-${section.id}` : "section-description"}
          name="description"
          rows={2}
        />
      </div>
      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}

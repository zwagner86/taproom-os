"use client";

import { useState } from "react";

import { Button, FieldHint, FieldLabel, Input, Select, Textarea } from "@/components/ui";

type ItemType = "pour" | "food" | "merch" | "event";

type ItemTypeFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  disabled?: boolean;
  defaultValues?: {
    name?: string;
    type?: ItemType;
    style_or_category?: string;
    abv?: number | null;
    description?: string;
  };
  submitLabel?: string;
};

const TYPE_OPTIONS: { value: ItemType; label: string }[] = [
  { value: "pour", label: "Pour" },
  { value: "food", label: "Food" },
  { value: "merch", label: "Merch" },
  { value: "event", label: "Event listing" },
];

export function ItemTypeForm({ action, disabled = false, defaultValues, submitLabel = "+ Add item" }: ItemTypeFormProps) {
  const [type, setType] = useState<ItemType>(defaultValues?.type ?? "pour");
  const showStyle = type === "pour" || type === "food" || type === "merch";
  const showAbv = type === "pour";
  const styleLabel = type === "pour" ? "Style" : "Category";
  const typeHint = type === "event"
    ? "Event listings can appear in mixed content feeds, but events are usually better managed from the Events screen."
    : type === "pour"
      ? "Use pours for beer, cider, wine, cocktails, or other drinks that belong on the menu."
      : type === "food"
        ? "Food items show up with your menu and can be grouped separately from drinks."
        : "Merch items are for packaged goods, glassware, apparel, and other retail items.";
  const nameHint = type === "event"
    ? "This title appears on internal lists and any public/event-style display cards that use this item."
    : "This name appears on menu cards, admin lists, and any displays that include this item.";
  const styleHint = type === "pour"
    ? "Shown as secondary style metadata on menus and displays when style details are enabled."
    : "Use a short grouping label like Snacks, Apparel, Glassware, or Specials.";
  const descriptionHint = type === "event"
    ? "Optional supporting copy for mixed content cards or internal context."
    : "Optional public-facing copy shown when descriptions are enabled on menus and displays.";

  return (
    <form action={action} className="flex flex-col gap-3">
      <fieldset className="contents" disabled={disabled}>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <FieldLabel
              htmlFor="create-type"
              info="Type controls where the item appears, which extra fields are shown, and how TaproomOS describes the item on public surfaces."
            >
              Type
            </FieldLabel>
            <Select
              aria-describedby="create-type-hint"
              defaultValue={type}
              id="create-type"
              name="type"
              onChange={(e) => setType(e.target.value as ItemType)}
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
            <FieldHint id="create-type-hint">{typeHint}</FieldHint>
          </div>
          <div className="flex flex-col gap-1">
            <FieldLabel htmlFor="create-name" required>Name</FieldLabel>
            <Input
              aria-describedby="create-name-hint"
              defaultValue={defaultValues?.name ?? ""}
              id="create-name"
              name="name"
              placeholder={
                type === "pour" ? "Ironwood IPA" :
                type === "food" ? "Pretzel Bites" :
                type === "merch" ? "Logo Pint Glass" :
                "Trivia Night"
              }
              required
            />
            <FieldHint id="create-name-hint">{nameHint}</FieldHint>
          </div>
        </div>

        {showStyle && (
          <div className={`grid gap-3 ${showAbv ? "md:grid-cols-2" : "grid-cols-1"}`}>
            <div className="flex flex-col gap-1">
              <FieldLabel htmlFor="create-style">{styleLabel}</FieldLabel>
              <Input
                aria-describedby="create-style-hint"
                defaultValue={defaultValues?.style_or_category ?? ""}
                id="create-style"
                name="style_or_category"
                placeholder={type === "pour" ? "IPA, Stout, Lager…" : "Snacks, Apparel…"}
              />
              <FieldHint id="create-style-hint">{styleHint}</FieldHint>
            </div>
            {showAbv && (
              <div className="flex flex-col gap-1">
                <FieldLabel
                  htmlFor="create-abv"
                  info="Enter alcohol by volume as a percentage, not a decimal. For example, use 6.7 for a 6.7% pour."
                >
                  ABV (%)
                </FieldLabel>
                <Input
                  aria-describedby="create-abv-hint"
                  defaultValue={defaultValues?.abv ?? ""}
                  id="create-abv"
                  name="abv"
                  placeholder="6.7"
                  step="0.1"
                  type="number"
                />
                <FieldHint id="create-abv-hint">Leave blank for non-alcoholic items or when ABV should stay hidden.</FieldHint>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <FieldLabel htmlFor="create-description">Description</FieldLabel>
          <Textarea
            aria-describedby="create-description-hint"
            defaultValue={defaultValues?.description ?? ""}
            id="create-description"
            name="description"
            placeholder="Short tasting note or menu copy"
            rows={2}
          />
          <FieldHint id="create-description-hint">{descriptionHint}</FieldHint>
        </div>

        <div className="flex gap-2 mt-1">
          <Button type="submit">{submitLabel}</Button>
        </div>
      </fieldset>
    </form>
  );
}

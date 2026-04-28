"use client";

import { useState } from "react";

import { Button, FieldHint, FieldLabel, Input, Select, Textarea } from "@/components/ui";
import { ITEM_STATUS_LABELS, type CatalogItemStatus, type CatalogItemType } from "@/lib/item-management";

type ItemTypeFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  disabled?: boolean;
  defaultValues?: {
    description?: string | null;
    display_order?: number;
    id?: string;
    menu_section_id?: string | null;
    name?: string;
    producer_location?: string | null;
    producer_name?: string | null;
    servings?: Array<{
      active?: boolean;
      currency?: string;
      glassware?: string | null;
      id?: string;
      label?: string;
      price_cents?: number | null;
      size_oz?: number | null;
    }>;
    status?: CatalogItemStatus;
    type?: CatalogItemType;
    abv?: number | null;
    style_or_category?: string | null;
  };
  fixedType?: CatalogItemType;
  sections?: Array<{
    active: boolean;
    id: string;
    item_type: CatalogItemType;
    name: string;
  }>;
  submitLabel?: string;
};

const TYPE_OPTIONS: { value: CatalogItemType; label: string }[] = [
  { value: "pour", label: "Pour" },
  { value: "food", label: "Food" },
  { value: "merch", label: "Merch" },
];

export function ItemTypeForm({
  action,
  disabled = false,
  defaultValues,
  fixedType,
  sections = [],
  submitLabel = "+ Add item",
}: ItemTypeFormProps) {
  const [type, setType] = useState<CatalogItemType>(fixedType ?? defaultValues?.type ?? "pour");
  const [servings, setServings] = useState(() =>
    (defaultValues?.servings?.length ? defaultValues.servings : [{ active: true, currency: "USD", label: type === "pour" ? "Pint" : "Serving" }]).map(
      (serving) => ({
        active: serving.active ?? true,
        currency: serving.currency ?? "USD",
        glassware: serving.glassware ?? "",
        id: serving.id ?? "",
        label: serving.label ?? "",
        price: serving.price_cents !== null && serving.price_cents !== undefined ? (serving.price_cents / 100).toFixed(2) : "",
        sizeOz: serving.size_oz ?? "",
      }),
    ),
  );
  const showTypeSelect = !fixedType;
  const showStyle = type === "pour" || type === "food" || type === "merch";
  const showAbv = type === "pour";
  const styleLabel = type === "pour" ? "Style" : "Category";
  const typeHint = type === "pour"
      ? "Use pours for beer, cider, wine, cocktails, or other drinks that belong on the menu."
      : type === "food"
        ? "Food items show up with your menu and can be grouped separately from drinks."
        : "Merch items are for packaged goods, glassware, apparel, and other retail items.";
  const nameHint = "This name appears on menu cards, admin lists, and any displays that include this item.";
  const styleHint = type === "pour"
    ? "Shown as secondary style metadata on menus and displays when style details are enabled."
    : "Use a short grouping label like Snacks, Apparel, Glassware, or Specials.";
  const descriptionHint = "Optional public-facing copy shown when descriptions are enabled on menus and displays.";

  return (
    <form action={action} className="flex flex-col gap-3">
      <fieldset className="contents" disabled={disabled}>
        {defaultValues?.id && <input name="item_id" type="hidden" value={defaultValues.id} />}
        <div className="grid gap-3 md:grid-cols-2">
          {showTypeSelect ? (
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
                onChange={(e) => setType(e.target.value as CatalogItemType)}
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
              <FieldHint id="create-type-hint">{typeHint}</FieldHint>
            </div>
          ) : (
            <input name="type" type="hidden" value={type} />
          )}
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
                "Logo Pint Glass"
              }
              required
            />
            <FieldHint id="create-name-hint">{nameHint}</FieldHint>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="flex flex-col gap-1">
            <FieldLabel htmlFor="create-section" required>Section</FieldLabel>
            <Select
              defaultValue={defaultValues?.menu_section_id ?? sections.find((section) => section.item_type === type)?.id ?? ""}
              id="create-section"
              name="menu_section_id"
              required
            >
              <option disabled value="">Pick a section...</option>
              {sections
                .filter((section) => section.item_type === type)
                .map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name}{section.active ? "" : " (hidden)"}
                  </option>
                ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <FieldLabel htmlFor="create-status">Status</FieldLabel>
            <Select defaultValue={defaultValues?.status ?? "active"} id="create-status" name="status">
              {Object.entries(ITEM_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <FieldLabel htmlFor="create-display-order">Order</FieldLabel>
            <Input defaultValue={defaultValues?.display_order ?? ""} id="create-display-order" name="display_order" type="number" />
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

        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <FieldLabel htmlFor="create-producer">Producer</FieldLabel>
            <Input
              defaultValue={defaultValues?.producer_name ?? ""}
              id="create-producer"
              name="producer_name"
              placeholder="Guest brewery or maker"
            />
          </div>
          <div className="flex flex-col gap-1">
            <FieldLabel htmlFor="create-origin">Producer location</FieldLabel>
            <Input
              defaultValue={defaultValues?.producer_location ?? ""}
              id="create-origin"
              name="producer_location"
              placeholder="Grand Rapids, MI"
            />
          </div>
        </div>

        <div className="rounded-xl border border-border p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">Servings</div>
              <FieldHint>Use one row for each pour size, glass, or package you want shown.</FieldHint>
            </div>
            <Button
              onClick={() =>
                setServings((current) => [
                  ...current,
                  { active: true, currency: "USD", glassware: "", id: "", label: "", price: "", sizeOz: "" },
                ])
              }
              size="sm"
              type="button"
              variant="secondary"
            >
              Add serving
            </Button>
          </div>
          <div className="space-y-3">
            {servings.map((serving, index) => (
              <div className="grid gap-2 rounded-lg border border-border/80 p-3 md:grid-cols-[1.1fr_0.7fr_1fr_0.7fr_0.7fr_auto]" key={index}>
                <div className="flex flex-col gap-1">
                  <FieldLabel htmlFor={`serving-label-${index}`}>Label</FieldLabel>
                  <Input
                    id={`serving-label-${index}`}
                    name="serving_label"
                    onChange={(event) =>
                      setServings((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, label: event.target.value } : row))
                    }
                    placeholder="Pint"
                    value={serving.label}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <FieldLabel htmlFor={`serving-size-${index}`}>Oz</FieldLabel>
                  <Input
                    id={`serving-size-${index}`}
                    name="serving_size_oz"
                    onChange={(event) =>
                      setServings((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, sizeOz: event.target.value } : row))
                    }
                    step="0.1"
                    type="number"
                    value={serving.sizeOz}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <FieldLabel htmlFor={`serving-glass-${index}`}>Glass</FieldLabel>
                  <Input
                    id={`serving-glass-${index}`}
                    name="serving_glassware"
                    onChange={(event) =>
                      setServings((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, glassware: event.target.value } : row))
                    }
                    placeholder="Tulip"
                    value={serving.glassware}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <FieldLabel htmlFor={`serving-price-${index}`}>Price</FieldLabel>
                  <Input
                    id={`serving-price-${index}`}
                    name="serving_price"
                    onChange={(event) =>
                      setServings((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, price: event.target.value } : row))
                    }
                    step="0.01"
                    type="number"
                    value={serving.price}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <FieldLabel htmlFor={`serving-currency-${index}`}>Currency</FieldLabel>
                  <Input
                    id={`serving-currency-${index}`}
                    name="serving_currency"
                    onChange={(event) =>
                      setServings((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, currency: event.target.value } : row))
                    }
                    value={serving.currency}
                  />
                </div>
                <div className="flex items-end gap-2">
                  <input name="serving_id" type="hidden" value={serving.id} />
                  <input name="serving_active" type="hidden" value={serving.active ? "on" : "off"} />
                  <label className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <input
                      checked={serving.active}
                      onChange={(event) =>
                        setServings((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, active: event.target.checked } : row))
                      }
                      type="checkbox"
                    />
                    Visible
                  </label>
                  <Button
                    disabled={servings.length === 1}
                    onClick={() => setServings((current) => current.filter((_, rowIndex) => rowIndex !== index))}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

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

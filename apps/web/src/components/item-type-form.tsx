"use client";

import { useState } from "react";

import { Button, Input, Label, Select, Textarea } from "@taproom/ui";

type ItemType = "pour" | "food" | "merch" | "event";

type ItemTypeFormProps = {
  action: (formData: FormData) => Promise<void>;
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

export function ItemTypeForm({ action, defaultValues, submitLabel = "+ Add item" }: ItemTypeFormProps) {
  const [type, setType] = useState<ItemType>(defaultValues?.type ?? "pour");
  const showStyle = type === "pour" || type === "food" || type === "merch";
  const showAbv = type === "pour";
  const styleLabel = type === "pour" ? "Style" : "Category";

  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="create-type">Type</Label>
          <Select
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
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="create-name">
            Name <span style={{ color: "var(--accent)" }}>*</span>
          </Label>
          <Input
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
        </div>
      </div>

      {showStyle && (
        <div className={`grid gap-3 ${showAbv ? "grid-cols-2" : "grid-cols-1"}`}>
          <div className="flex flex-col gap-1">
            <Label htmlFor="create-style">{styleLabel}</Label>
            <Input
              defaultValue={defaultValues?.style_or_category ?? ""}
              id="create-style"
              name="style_or_category"
              placeholder={type === "pour" ? "IPA, Stout, Lager…" : "Snacks, Apparel…"}
            />
          </div>
          {showAbv && (
            <div className="flex flex-col gap-1">
              <Label htmlFor="create-abv">ABV (%)</Label>
              <Input
                defaultValue={defaultValues?.abv ?? ""}
                id="create-abv"
                name="abv"
                placeholder="6.7"
                step="0.1"
                type="number"
              />
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1">
        <Label htmlFor="create-description">Description</Label>
        <Textarea
          defaultValue={defaultValues?.description ?? ""}
          id="create-description"
          name="description"
          placeholder="Short tasting note or menu copy"
          rows={2}
        />
      </div>

      <div className="flex gap-2 mt-1">
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}

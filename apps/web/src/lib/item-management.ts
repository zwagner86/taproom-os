export type CatalogItemType = "pour" | "food" | "merch";

export type ItemSectionConfig = {
  description: string;
  emptyDescription: string;
  label: string;
  newLabel: string;
  singularLabel: string;
  type: CatalogItemType;
};

export const ITEM_SECTION_CONFIGS: ItemSectionConfig[] = [
  {
    description: "Drinks that appear on tap lists, menus, and pour-focused displays.",
    emptyDescription: "Add the first drink or tap list item for this venue.",
    label: "Pours",
    newLabel: "New pour",
    singularLabel: "pour",
    type: "pour",
  },
  {
    description: "Kitchen items, snacks, specials, and other food menu entries.",
    emptyDescription: "Add the first food item for this venue.",
    label: "Food",
    newLabel: "New food",
    singularLabel: "food",
    type: "food",
  },
  {
    description: "Retail goods like glassware, apparel, packaged items, and venue merch.",
    emptyDescription: "Add the first merch item for this venue.",
    label: "Merch",
    newLabel: "New merch",
    singularLabel: "merch",
    type: "merch",
  },
];

export const ITEM_SECTION_CONFIG_BY_TYPE = Object.fromEntries(
  ITEM_SECTION_CONFIGS.map((section) => [section.type, section]),
) as Record<CatalogItemType, ItemSectionConfig>;

export function groupCatalogItems<T extends { type: string }>(items: T[]) {
  return Object.fromEntries(
    ITEM_SECTION_CONFIGS.map((section) => [
      section.type,
      items.filter((item) => item.type === section.type),
    ]),
  ) as Record<CatalogItemType, T[]>;
}

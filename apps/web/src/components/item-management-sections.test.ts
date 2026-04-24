import { describe, expect, it } from "vitest";

import { groupCatalogItems } from "@/lib/item-management";

describe("item management sections", () => {
  it("groups catalog items into pours, food, and merch only", () => {
    const grouped = groupCatalogItems([
      { id: "item-1", type: "pour" },
      { id: "item-2", type: "food" },
      { id: "item-3", type: "merch" },
      { id: "item-4", type: "event" },
    ]);

    expect(grouped.pour.map((item) => item.id)).toEqual(["item-1"]);
    expect(grouped.food.map((item) => item.id)).toEqual(["item-2"]);
    expect(grouped.merch.map((item) => item.id)).toEqual(["item-3"]);
    expect(Object.keys(grouped)).toEqual(["pour", "food", "merch"]);
  });
});

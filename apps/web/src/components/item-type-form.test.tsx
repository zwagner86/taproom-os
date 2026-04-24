import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ItemTypeForm } from "./item-type-form";

describe("item type form", () => {
  it("renders a fixed pour form with hidden type and ABV fields", () => {
    const markup = renderToStaticMarkup(
      createElement(ItemTypeForm, {
        action: async () => {},
        fixedType: "pour",
        submitLabel: "Add pour",
      }),
    );

    expect(markup).toContain('name="type"');
    expect(markup).toContain('value="pour"');
    expect(markup).toContain("ABV (%)");
    expect(markup).toContain("Add pour");
    expect(markup).not.toContain("Event listing");
    expect(markup).not.toContain("<select");
  });

  it("renders fixed food and merch forms without ABV fields", () => {
    const foodMarkup = renderToStaticMarkup(
      createElement(ItemTypeForm, {
        action: async () => {},
        fixedType: "food",
        submitLabel: "Add food",
      }),
    );
    const merchMarkup = renderToStaticMarkup(
      createElement(ItemTypeForm, {
        action: async () => {},
        fixedType: "merch",
        submitLabel: "Add merch",
      }),
    );

    expect(foodMarkup).toContain('value="food"');
    expect(foodMarkup).not.toContain("ABV (%)");
    expect(merchMarkup).toContain('value="merch"');
    expect(merchMarkup).not.toContain("ABV (%)");
  });
});

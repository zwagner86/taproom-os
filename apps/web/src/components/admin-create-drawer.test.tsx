import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AdminCreateDrawer, AdminFormDrawer } from "./admin-create-drawer";

describe("admin create drawer", () => {
  it("renders a new-action trigger while keeping drawer content closed by default", () => {
    const markup = renderToStaticMarkup(
      createElement(
        AdminCreateDrawer,
        {
          children: createElement("div", null, "Drawer form body"),
          description: "Create a record from the drawer.",
          title: "New record",
          triggerLabel: "New record",
        },
      ),
    );

    expect(markup).toContain("New record");
    expect(markup).not.toContain("Drawer form body");
    expect(markup).not.toContain("Create a record from the drawer.");
  });

  it("supports non-create triggers while keeping drawer content closed by default", () => {
    const markup = renderToStaticMarkup(
      createElement(AdminFormDrawer, {
        children: createElement("div", null, "Edit form body"),
        description: "Edit this record from the drawer.",
        title: "Edit record",
        triggerIcon: null,
        triggerLabel: "Edit",
        triggerSize: "sm",
        triggerVariant: "secondary",
      }),
    );

    expect(markup).toContain("Edit");
    expect(markup).not.toContain("Edit form body");
    expect(markup).not.toContain("Edit this record from the drawer.");
  });
});

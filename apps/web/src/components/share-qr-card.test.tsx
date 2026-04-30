import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ShareQrCard } from "./share-qr-card";

describe("share QR card", () => {
  it("renders acrylic sign print links", () => {
    const markup = renderToStaticMarkup(
      createElement(ShareQrCard, {
        destination: {
          description: "Point guests to your live public menu.",
          fileName: "demo-taproom-menu-qr",
          id: "menu",
          kind: "menu",
          label: "Menu",
          path: "/v/demo-taproom/menu",
          printKey: "menu",
          subtitle: "Full menu page",
          url: "https://taproomos.example/v/demo-taproom/menu",
        },
        venueSlug: "demo-taproom",
      }),
    );

    expect(markup).toContain("8.5 x 11");
    expect(markup).toContain("5.5 x 8.5");
    expect(markup).toContain("4 x 6");
    expect(markup).toContain("/app/demo-taproom/share/print/menu/pdf?layout=letter");
    expect(markup).toContain("/app/demo-taproom/share/print/menu/pdf?layout=half-letter");
    expect(markup).toContain("/app/demo-taproom/share/print/menu/pdf?layout=photo-4x6");
    expect(markup).not.toContain("Table tent");
    expect(markup).not.toContain("Poster");
  });
});

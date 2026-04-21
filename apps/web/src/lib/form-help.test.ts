import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FieldHint, FieldLabel, Input, Toggle } from "@taproom/ui";

describe("admin form help markup", () => {
  it("renders required labels with an info trigger", () => {
    const markup = renderToStaticMarkup(
      createElement(
        FieldLabel,
        {
          children: "Venue name",
          htmlFor: "venue-name",
          info: "Shown across admin and public pages.",
          required: true,
        },
      ),
    );

    expect(markup).toContain('for="venue-name"');
    expect(markup).toContain("Venue name");
    expect(markup).toContain(" *");
    expect(markup).toContain('aria-label="More information about Venue name"');
  });

  it("connects helper copy through aria-describedby", () => {
    const markup = renderToStaticMarkup(
      createElement(
        "div",
        null,
        createElement(Input, { "aria-describedby": "venue-name-hint", id: "venue-name" }),
        createElement(FieldHint, { id: "venue-name-hint" }, "Shown on public pages and internal admin screens."),
      ),
    );

    expect(markup).toContain('aria-describedby="venue-name-hint"');
    expect(markup).toContain('id="venue-name-hint"');
    expect(markup).toContain("Shown on public pages and internal admin screens.");
  });

  it("supports info triggers and helper text on select-style field blocks", () => {
    const markup = renderToStaticMarkup(
      createElement(
        "div",
        null,
        createElement(FieldLabel, {
          children: "Preset type",
          htmlFor: "display-kind",
          info: "Choose between a single view and a rotating playlist.",
        }),
        createElement(Input, { "aria-describedby": "display-kind-hint", id: "display-kind" }),
        createElement(FieldHint, { id: "display-kind-hint" }, "Choose View for a single output, or Playlist to rotate through multiple saved views."),
      ),
    );

    expect(markup).toContain('aria-label="More information about Preset type"');
    expect(markup).toContain('aria-describedby="display-kind-hint"');
    expect(markup).toContain("Choose View for a single output, or Playlist to rotate through multiple saved views.");
  });

  it("wires helper copy to toggle controls for checkbox-style fields", () => {
    const markup = renderToStaticMarkup(
      createElement(
        "div",
        null,
        createElement(Toggle, {
          checked: true,
          describedBy: "show-logo-hint",
          id: "show-logo",
          label: "Logo",
          onChange: () => {},
        }),
        createElement(FieldHint, { id: "show-logo-hint" }, "Show the venue logo when one is available."),
      ),
    );

    expect(markup).toContain('id="show-logo"');
    expect(markup).toContain('aria-describedby="show-logo-hint"');
    expect(markup).toContain("Show the venue logo when one is available.");
  });
});

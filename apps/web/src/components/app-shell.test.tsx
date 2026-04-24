import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const { mockUsePathname } = vi.hoisted(() => ({
  mockUsePathname: vi.fn(() => "/app/demo-taproom/displays"),
}));

vi.mock("next/navigation", () => ({
  usePathname: mockUsePathname,
}));

import { AppShell } from "./app-shell";

const navGroups = [
  {
    id: "venue",
    items: [
      { href: "/app/demo-taproom/displays", label: "Displays" },
      { href: "/app/demo-taproom/items", label: "Items" },
    ],
    label: "Venue Admin",
  },
];

describe("app shell", () => {
  it("shows internal context for platform admins", () => {
    const markup = renderToStaticMarkup(
      createElement(
        AppShell,
        {
          children: createElement("div", null, "Demo content"),
          demoMode: true,
          groups: navGroups,
          internalHref: "/internal",
          platformAdminMode: true,
          userInitials: "FW",
          userLabel: "founder@example.com",
          venueName: "Demo Taproom",
          venueSlug: "demo-taproom",
          venueType: "brewery",
        },
      ),
    );

    expect(markup).toContain("Platform admin");
    expect(markup).toContain("Back to internal");
    expect(markup).toContain("Platform admin access");
    expect(markup).toContain("Demo venue.");
  });

  it("keeps internal-only affordances out of regular venue admin", () => {
    const markup = renderToStaticMarkup(
      createElement(
        AppShell,
        {
          children: createElement("div", null, "Venue content"),
          demoMode: false,
          groups: navGroups,
          userInitials: "OW",
          userLabel: "owner@example.com",
          venueName: "Neighborhood Brewery",
          venueSlug: "neighborhood-brewery",
          venueType: "brewery",
        },
      ),
    );

    expect(markup).not.toContain("Back to internal");
    expect(markup).not.toContain("Platform admin access");
    expect(markup).toContain("Venue admin access");
  });
});

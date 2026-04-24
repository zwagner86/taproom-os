import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const {
  mockListVenuesForUser,
  mockRequirePlatformAdmin,
} = vi.hoisted(() => ({
  mockListVenuesForUser: vi.fn(),
  mockRequirePlatformAdmin: vi.fn(),
}));

vi.mock("@/server/auth", () => ({
  requirePlatformAdmin: mockRequirePlatformAdmin,
}));

vi.mock("@/server/repositories/venues", () => ({
  listVenuesForUser: mockListVenuesForUser,
}));

import InternalDashboardPage from "./page";

afterEach(() => {
  mockListVenuesForUser.mockReset();
  mockRequirePlatformAdmin.mockReset();
});

describe("internal dashboard", () => {
  it("renders demo tools and venue impersonation links", async () => {
    mockRequirePlatformAdmin.mockResolvedValue({ email: "founder@example.com", id: "user-1" });
    mockListVenuesForUser.mockResolvedValue([
      { id: "venue-demo", name: "Demo Taproom", slug: "demo-taproom", venue_type: "brewery" },
      { id: "venue-2", name: "Northline Brewing", slug: "northline", venue_type: "brewery" },
    ]);

    const markup = renderToStaticMarkup(await InternalDashboardPage());

    expect(markup).toContain("Platform Admin");
    expect(markup).toContain("Demo tools");
    expect(markup).toContain('href="/internal/venues/demo-taproom/impersonate"');
    expect(markup).toContain("Venue access");
    expect(markup).toContain('href="/internal/venues/northline/impersonate"');
  });

  it("keeps the demo card visible when the seeded venue is missing", async () => {
    mockRequirePlatformAdmin.mockResolvedValue({ email: "founder@example.com", id: "user-1" });
    mockListVenuesForUser.mockResolvedValue([]);

    const markup = renderToStaticMarkup(await InternalDashboardPage());

    expect(markup).toContain("The demo venue is not seeded in this environment yet.");
    expect(markup).toContain("supabase/seed.sql");
    expect(markup).not.toContain('href="/internal/venues/demo-taproom/impersonate"');
  });
});

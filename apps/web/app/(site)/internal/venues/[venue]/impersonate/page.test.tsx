import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const {
  mockGetVenueBySlug,
  mockRequirePlatformAdmin,
} = vi.hoisted(() => ({
  mockGetVenueBySlug: vi.fn(),
  mockRequirePlatformAdmin: vi.fn(),
}));

vi.mock("@/server/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/server/auth")>();
  return {
    ...actual,
    requirePlatformAdmin: mockRequirePlatformAdmin,
  };
});

vi.mock("@/server/repositories/venues", () => ({
  getVenueBySlug: mockGetVenueBySlug,
}));

import ImpersonateVenuePage from "./page";

afterEach(() => {
  mockGetVenueBySlug.mockReset();
  mockRequirePlatformAdmin.mockReset();
});

describe("internal impersonation page", () => {
  it("renders the explicit platform-admin handoff", async () => {
    mockRequirePlatformAdmin.mockResolvedValue({ email: "founder@example.com", id: "user-1" });
    mockGetVenueBySlug.mockResolvedValue({
      id: "venue-demo",
      name: "Demo Taproom",
      slug: "demo-taproom",
      venue_type: "brewery",
    });

    const markup = renderToStaticMarkup(
      await ImpersonateVenuePage({
        params: Promise.resolve({ venue: "demo-taproom" }),
        searchParams: Promise.resolve({ next: "/app/demo-taproom/displays" }),
      }),
    );

    expect(markup).toContain("Impersonation");
    expect(markup).toContain("Demo mode");
    expect(markup).toContain('href="/internal"');
    expect(markup).toContain("Continue to requested screen");
    expect(markup).toContain('href="/app/demo-taproom/displays"');
  });

  it("stays platform-admin only", async () => {
    mockRequirePlatformAdmin.mockRejectedValue(new Error("redirect:/"));

    await expect(
      ImpersonateVenuePage({
        params: Promise.resolve({ venue: "demo-taproom" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("redirect:/");
  });
});

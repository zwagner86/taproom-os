import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const {
  mockGetOptionalUser,
  mockIsPlatformAdmin,
  mockListVenuesForUser,
} = vi.hoisted(() => ({
  mockGetOptionalUser: vi.fn(),
  mockIsPlatformAdmin: vi.fn(),
  mockListVenuesForUser: vi.fn(),
}));

vi.mock("@/server/auth", () => ({
  getOptionalUser: mockGetOptionalUser,
  isPlatformAdmin: mockIsPlatformAdmin,
}));

vi.mock("@/server/repositories/venues", () => ({
  listVenuesForUser: mockListVenuesForUser,
}));

import HomePage from "./page";

afterEach(() => {
  mockGetOptionalUser.mockReset();
  mockIsPlatformAdmin.mockReset();
  mockListVenuesForUser.mockReset();
});

describe("home page", () => {
  it("routes platform admins to the internal dashboard", async () => {
    mockGetOptionalUser.mockResolvedValue({ email: "founder@example.com", id: "user-1" });
    mockIsPlatformAdmin.mockResolvedValue(true);
    mockListVenuesForUser.mockResolvedValue([]);

    const markup = renderToStaticMarkup(await HomePage());

    expect(markup).toContain('href="/internal"');
    expect(markup).not.toContain('href="/internal/venues"');
  });

  it("keeps internal entrypoints hidden for regular users", async () => {
    mockGetOptionalUser.mockResolvedValue({ email: "owner@example.com", id: "user-2" });
    mockIsPlatformAdmin.mockResolvedValue(false);
    mockListVenuesForUser.mockResolvedValue([]);

    const markup = renderToStaticMarkup(await HomePage());

    expect(markup).not.toContain('href="/internal"');
  });
});

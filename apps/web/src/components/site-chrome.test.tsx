import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const {
  mockGetOptionalUser,
  mockIsPlatformAdmin,
} = vi.hoisted(() => ({
  mockGetOptionalUser: vi.fn(),
  mockIsPlatformAdmin: vi.fn(),
}));

vi.mock("@/server/auth", () => ({
  getOptionalUser: mockGetOptionalUser,
  isPlatformAdmin: mockIsPlatformAdmin,
}));

import { SiteChrome } from "./site-chrome";

afterEach(() => {
  mockGetOptionalUser.mockReset();
  mockIsPlatformAdmin.mockReset();
});

describe("site chrome", () => {
  it("shows the internal link for platform admins", async () => {
    mockGetOptionalUser.mockResolvedValue({ email: "founder@example.com", id: "user-1" });
    mockIsPlatformAdmin.mockResolvedValue(true);

    const markup = renderToStaticMarkup(await SiteChrome());

    expect(markup).toContain('href="/internal"');
    expect(markup).toContain("Platform admin");
    expect(markup).toContain('href="/v/demo-taproom/menu"');
  });

  it("hides internal-only navigation for regular users", async () => {
    mockGetOptionalUser.mockResolvedValue({ email: "owner@example.com", id: "user-2" });
    mockIsPlatformAdmin.mockResolvedValue(false);

    const markup = renderToStaticMarkup(await SiteChrome());

    expect(markup).not.toContain('href="/internal"');
    expect(markup).not.toContain("Platform admin");
  });
});

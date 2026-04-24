import { afterEach, describe, expect, it, vi } from "vitest";

const {
  mockCreateAdminSupabaseClient,
  mockCreateServerSupabaseClient,
  mockGetEnv,
  mockGetPlatformAdminEmails,
  mockRedirect,
} = vi.hoisted(() => ({
  mockCreateAdminSupabaseClient: vi.fn(),
  mockCreateServerSupabaseClient: vi.fn(),
  mockGetEnv: vi.fn(),
  mockGetPlatformAdminEmails: vi.fn(),
  mockRedirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));

vi.mock("@/env", () => ({
  getEnv: mockGetEnv,
  getPlatformAdminEmails: mockGetPlatformAdminEmails,
}));

vi.mock("@/lib/supabase/server", () => ({
  createAdminSupabaseClient: mockCreateAdminSupabaseClient,
  createServerSupabaseClient: mockCreateServerSupabaseClient,
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

afterEach(() => {
  mockCreateAdminSupabaseClient.mockReset();
  mockCreateServerSupabaseClient.mockReset();
  mockGetEnv.mockReset();
  mockGetPlatformAdminEmails.mockReset();
  mockRedirect.mockClear();
  vi.resetModules();
});

describe("auth actions", () => {
  it("redirects platform-admin password sign-ins to the internal landing", async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({
      data: {
        user: {
          email: "founder@example.com",
          id: "user-1",
        },
      },
      error: null,
    });
    const upsert = vi.fn().mockResolvedValue({ error: null });

    mockGetEnv.mockReturnValue({ NEXT_PUBLIC_APP_URL: "http://localhost:3000" });
    mockGetPlatformAdminEmails.mockReturnValue(new Set(["founder@example.com"]));
    mockCreateServerSupabaseClient.mockResolvedValue({
      auth: { signInWithPassword },
    });
    mockCreateAdminSupabaseClient.mockResolvedValue({
      from: vi.fn().mockReturnValue({ upsert }),
    });

    const { signInWithPasswordAction } = await import("./auth");
    const formData = new FormData();
    formData.set("email", "founder@example.com");
    formData.set("password", "secret-password");

    await expect(signInWithPasswordAction(formData)).rejects.toThrow("redirect:/internal");
    expect(upsert).toHaveBeenCalledWith({ user_id: "user-1" }, { onConflict: "user_id" });
  });

  it("routes platform-admin venue targets through impersonation after password sign-in", async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({
      data: {
        user: {
          email: "founder@example.com",
          id: "user-2",
        },
      },
      error: null,
    });
    const upsert = vi.fn().mockResolvedValue({ error: null });

    mockGetEnv.mockReturnValue({ NEXT_PUBLIC_APP_URL: "http://localhost:3000" });
    mockGetPlatformAdminEmails.mockReturnValue(new Set(["founder@example.com"]));
    mockCreateServerSupabaseClient.mockResolvedValue({
      auth: { signInWithPassword },
    });
    mockCreateAdminSupabaseClient.mockResolvedValue({
      from: vi.fn().mockReturnValue({ upsert }),
    });

    const { signInWithPasswordAction } = await import("./auth");
    const formData = new FormData();
    formData.set("email", "founder@example.com");
    formData.set("password", "secret-password");
    formData.set("next", "/app/demo-taproom/displays");

    await expect(signInWithPasswordAction(formData)).rejects.toThrow(
      "redirect:/internal/venues/demo-taproom/impersonate?next=%2Fapp%2Fdemo-taproom%2Fdisplays",
    );
  });

  it("keeps non-admin password sign-ins on their requested destination", async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({
      data: {
        user: {
          email: "owner@example.com",
          id: "user-3",
        },
      },
      error: null,
    });
    const maybeSingle = vi.fn().mockResolvedValue({ data: null });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });

    mockGetEnv.mockReturnValue({ NEXT_PUBLIC_APP_URL: "http://localhost:3000" });
    mockGetPlatformAdminEmails.mockReturnValue(new Set());
    mockCreateServerSupabaseClient.mockResolvedValue({
      auth: { signInWithPassword },
      from,
    });

    const { signInWithPasswordAction } = await import("./auth");
    const formData = new FormData();
    formData.set("email", "owner@example.com");
    formData.set("password", "secret-password");
    formData.set("next", "/app/neighborhood-brewery/items");

    await expect(signInWithPasswordAction(formData)).rejects.toThrow(
      "redirect:/app/neighborhood-brewery/items",
    );
    expect(from).toHaveBeenCalledWith("platform_admins");
  });
});

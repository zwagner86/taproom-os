import { afterEach, describe, expect, it, vi } from "vitest";

const {
  mockCreateAdminSupabaseClient,
  mockCreateServerSupabaseClient,
  mockCookies,
  mockGetPlatformAdminEmails,
  mockRedirect,
} = vi.hoisted(() => ({
  mockCreateAdminSupabaseClient: vi.fn(),
  mockCreateServerSupabaseClient: vi.fn(),
  mockCookies: vi.fn(),
  mockGetPlatformAdminEmails: vi.fn(),
  mockRedirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));

vi.mock("@/env", () => ({
  getPlatformAdminEmails: mockGetPlatformAdminEmails,
}));

vi.mock("@/lib/supabase/server", () => ({
  createAdminSupabaseClient: mockCreateAdminSupabaseClient,
  createServerSupabaseClient: mockCreateServerSupabaseClient,
}));

vi.mock("next/headers", () => ({
  cookies: mockCookies,
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

afterEach(() => {
  mockCreateAdminSupabaseClient.mockReset();
  mockCookies.mockReset();
  mockCreateServerSupabaseClient.mockReset();
  mockGetPlatformAdminEmails.mockReset();
  mockRedirect.mockClear();
  vi.resetModules();
});

describe("server auth helpers", () => {
  it("dedupes repeated user and admin lookups within one request", async () => {
    const cookieStore = {};
    const authGetUser = vi.fn().mockResolvedValue({
      data: {
        user: {
          email: "owner@example.com",
          id: "user-1",
        },
      },
    });
    const maybeSingle = vi.fn().mockResolvedValue({ data: { id: "platform-admin-1" } });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });

    mockCookies.mockResolvedValue(cookieStore);
    mockGetPlatformAdminEmails.mockReturnValue(new Set());
    mockCreateServerSupabaseClient.mockResolvedValue({
      auth: { getUser: authGetUser },
      from,
    });

    const { getOptionalUser, isPlatformAdmin } = await import("./auth");
    const [user, admin, repeatedUser, repeatedAdmin] = await Promise.all([
      getOptionalUser(),
      isPlatformAdmin(),
      getOptionalUser(),
      isPlatformAdmin(),
    ]);

    expect(user?.id).toBe("user-1");
    expect(repeatedUser?.id).toBe("user-1");
    expect(admin).toBe(true);
    expect(repeatedAdmin).toBe(true);
    expect(mockCreateServerSupabaseClient).toHaveBeenCalledTimes(1);
    expect(authGetUser).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledWith("platform_admins");
    expect(maybeSingle).toHaveBeenCalledTimes(1);
  });

  it("treats PLATFORM_ADMIN_EMAILS as a platform-admin bootstrap", async () => {
    const cookieStore = {};
    const authGetUser = vi.fn().mockResolvedValue({
      data: {
        user: {
          email: "founder@example.com",
          id: "user-2",
        },
      },
    });
    const from = vi.fn();

    mockCookies.mockResolvedValue(cookieStore);
    mockGetPlatformAdminEmails.mockReturnValue(new Set(["founder@example.com"]));
    mockCreateServerSupabaseClient.mockResolvedValue({
      auth: { getUser: authGetUser },
      from,
    });

    const { isPlatformAdmin, requirePlatformAdmin } = await import("./auth");
    const [admin, user] = await Promise.all([isPlatformAdmin(), requirePlatformAdmin()]);

    expect(admin).toBe(true);
    expect(user.id).toBe("user-2");
    expect(from).not.toHaveBeenCalled();
  });

  it("syncs matching bootstrap users into the platform_admins table", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });

    mockGetPlatformAdminEmails.mockReturnValue(new Set(["founder@example.com"]));
    mockCreateAdminSupabaseClient.mockResolvedValue({
      from: vi.fn().mockReturnValue({ upsert }),
    });

    const { syncPlatformAdminBootstrap } = await import("./auth");
    const synced = await syncPlatformAdminBootstrap({
      email: "founder@example.com",
      id: "user-4",
    } as any);

    expect(synced).toBe(true);
    expect(upsert).toHaveBeenCalledWith({ user_id: "user-4" }, { onConflict: "user_id" });
  });

  it("resolves post-auth redirects through impersonation for venue-admin paths", async () => {
    const { resolvePostAuthRedirect } = await import("./auth");

    expect(
      resolvePostAuthRedirect({
        isPlatformAdmin: true,
        next: "/app/demo-taproom/displays?tab=views",
      }),
    ).toBe("/internal/venues/demo-taproom/impersonate?next=%2Fapp%2Fdemo-taproom%2Fdisplays%3Ftab%3Dviews");
    expect(
      resolvePostAuthRedirect({
        isPlatformAdmin: true,
        next: "/",
      }),
    ).toBe("/internal");
    expect(
      resolvePostAuthRedirect({
        isPlatformAdmin: false,
        next: "/app/demo-taproom/displays",
      }),
    ).toBe("/app/demo-taproom/displays");
  });

  it("keeps existing platform admins even when the email bootstrap does not match", async () => {
    const authGetUser = vi.fn().mockResolvedValue({
      data: {
        user: {
          email: "ops@example.com",
          id: "user-5",
        },
      },
    });
    const maybeSingle = vi.fn().mockResolvedValue({ data: { id: "platform-admin-2" } });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });

    mockCookies.mockResolvedValue({});
    mockGetPlatformAdminEmails.mockReturnValue(new Set(["founder@example.com"]));
    mockCreateServerSupabaseClient.mockResolvedValue({
      auth: { getUser: authGetUser },
      from,
    });

    const { isPlatformAdmin } = await import("./auth");

    await expect(isPlatformAdmin()).resolves.toBe(true);
    expect(from).toHaveBeenCalledWith("platform_admins");
  });

  it("redirects non-platform-admin users away from internal routes", async () => {
    const cookieStore = {};
    const authGetUser = vi.fn().mockResolvedValue({
      data: {
        user: {
          email: "staff@example.com",
          id: "user-3",
        },
      },
    });
    const maybeSingle = vi.fn().mockResolvedValue({ data: null });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });

    mockCookies.mockResolvedValue(cookieStore);
    mockGetPlatformAdminEmails.mockReturnValue(new Set());
    mockCreateServerSupabaseClient.mockResolvedValue({
      auth: { getUser: authGetUser },
      from,
    });

    const { requirePlatformAdmin } = await import("./auth");

    await expect(requirePlatformAdmin()).rejects.toThrow("redirect:/");
    expect(from).toHaveBeenCalledWith("platform_admins");
  });
});

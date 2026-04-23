import { afterEach, describe, expect, it, vi } from "vitest";

const {
  mockCreateServerSupabaseClient,
  mockCookies,
  mockGetPlatformAdminEmails,
  mockRedirect,
} = vi.hoisted(() => ({
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
  createServerSupabaseClient: mockCreateServerSupabaseClient,
}));

vi.mock("next/headers", () => ({
  cookies: mockCookies,
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

afterEach(() => {
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
});

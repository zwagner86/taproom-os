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

describe("venue access", () => {
  it("reuses the cached auth lookup inside requireVenueAccess", async () => {
    const cookieStore = {};
    const authGetUser = vi.fn().mockResolvedValue({
      data: {
        user: {
          email: "manager@example.com",
          id: "user-1",
        },
      },
    });
    const maybeSingleVenue = vi.fn().mockResolvedValue({
      data: {
        id: "venue-1",
        name: "Demo Taproom",
        slug: "demo-taproom",
      },
    });
    const maybeSinglePlatformAdmin = vi.fn().mockResolvedValue({ data: null });
    const maybeSingleMembership = vi.fn().mockResolvedValue({
      data: {
        id: "membership-1",
        user_id: "user-1",
        venue_id: "venue-1",
      },
    });

    mockCookies.mockResolvedValue(cookieStore);
    mockGetPlatformAdminEmails.mockReturnValue(new Set());
    mockCreateServerSupabaseClient.mockResolvedValue({
      auth: { getUser: authGetUser },
      from(table: string) {
        if (table === "venues") {
          return {
            select() {
              return {
                eq() {
                  return { maybeSingle: maybeSingleVenue };
                },
              };
            },
          };
        }

        if (table === "platform_admins") {
          return {
            select() {
              return {
                eq() {
                  return { maybeSingle: maybeSinglePlatformAdmin };
                },
              };
            },
          };
        }

        if (table === "venue_users") {
          return {
            select() {
              return {
                eq() {
                  return {
                    eq() {
                      return { maybeSingle: maybeSingleMembership };
                    },
                  };
                },
              };
            },
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      },
    });

    const { requireVenueAccess } = await import("./venues");
    const access = await requireVenueAccess("demo-taproom");

    expect(access.user.id).toBe("user-1");
    expect(access.venue.id).toBe("venue-1");
    expect(access.isPlatformAdmin).toBe(false);
    expect(access.membership?.id).toBe("membership-1");
    expect(authGetUser).toHaveBeenCalledTimes(1);
    expect(maybeSinglePlatformAdmin).toHaveBeenCalledTimes(1);
    expect(maybeSingleVenue).toHaveBeenCalledTimes(1);
    expect(maybeSingleMembership).toHaveBeenCalledTimes(1);
  });
});

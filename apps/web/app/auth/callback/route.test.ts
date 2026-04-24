import { afterEach, describe, expect, it, vi } from "vitest";

const {
  mockCreateAdminSupabaseClient,
  mockCreateServerSupabaseClient,
  mockGetPlatformAdminEmails,
} = vi.hoisted(() => ({
  mockCreateAdminSupabaseClient: vi.fn(),
  mockCreateServerSupabaseClient: vi.fn(),
  mockGetPlatformAdminEmails: vi.fn(),
}));

vi.mock("@/env", () => ({
  getPlatformAdminEmails: mockGetPlatformAdminEmails,
}));

vi.mock("@/lib/supabase/server", () => ({
  createAdminSupabaseClient: mockCreateAdminSupabaseClient,
  createServerSupabaseClient: mockCreateServerSupabaseClient,
}));

import { GET } from "./route";

afterEach(() => {
  mockCreateAdminSupabaseClient.mockReset();
  mockCreateServerSupabaseClient.mockReset();
  mockGetPlatformAdminEmails.mockReset();
  vi.resetModules();
});

describe("auth callback route", () => {
  it("sends platform admins to the internal landing after callback completion", async () => {
    const exchangeCodeForSession = vi.fn().mockResolvedValue(undefined);
    const getUser = vi.fn().mockResolvedValue({
      data: {
        user: {
          email: "founder@example.com",
          id: "user-1",
        },
      },
      error: null,
    });
    const upsert = vi.fn().mockResolvedValue({ error: null });

    mockGetPlatformAdminEmails.mockReturnValue(new Set(["founder@example.com"]));
    mockCreateServerSupabaseClient.mockResolvedValue({
      auth: { exchangeCodeForSession, getUser },
    });
    mockCreateAdminSupabaseClient.mockResolvedValue({
      from: vi.fn().mockReturnValue({ upsert }),
    });

    const response = await GET(new Request("http://localhost/auth/callback?code=auth-code"));

    expect(exchangeCodeForSession).toHaveBeenCalledWith("auth-code");
    expect(response.headers.get("location")).toBe("http://localhost/internal");
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";

const { mockCreateServerSupabaseClient } = vi.hoisted(() => ({
  mockCreateServerSupabaseClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createAdminSupabaseClient: vi.fn(),
  createServerSupabaseClient: mockCreateServerSupabaseClient,
}));

afterEach(() => {
  mockCreateServerSupabaseClient.mockReset();
  vi.resetModules();
});

describe("event repository public lookup", () => {
  it("resolves public events by immutable id or legacy slug", async () => {
    const event = {
      id: "event-1",
      slug: "trivia-night",
      title: "Trivia Night",
    };
    const venue = {
      id: "venue-1",
      slug: "demo-taproom",
    };

    mockCreateServerSupabaseClient.mockResolvedValue({
      from(table: string) {
        if (table === "venues") {
          return {
            select() {
              return {
                eq() {
                  return {
                    maybeSingle: vi.fn().mockResolvedValue({ data: venue, error: null }),
                  };
                },
              };
            },
          };
        }

        if (table === "events") {
          return {
            select() {
              return {
                eq() {
                  return {
                    eq() {
                      return {
                        eq() {
                          return {
                            order: vi.fn().mockResolvedValue({ data: [event], error: null }),
                          };
                        },
                      };
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

    const { getPublicVenueEventByKey } = await import("./events");

    await expect(getPublicVenueEventByKey("demo-taproom", "event-1")).resolves.toMatchObject({
      event: { id: "event-1" },
      venue: { id: "venue-1" },
    });
    await expect(getPublicVenueEventByKey("demo-taproom", "trivia-night")).resolves.toMatchObject({
      event: { id: "event-1" },
      venue: { id: "venue-1" },
    });
  });
});

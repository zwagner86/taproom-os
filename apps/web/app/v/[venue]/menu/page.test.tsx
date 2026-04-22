import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const { mockGetCanonicalPublicDisplayViewConfig } = vi.hoisted(() => ({
  mockGetCanonicalPublicDisplayViewConfig: vi.fn(),
}));

vi.mock("@/server/repositories/display-views", () => ({
  getCanonicalPublicDisplayViewConfig: mockGetCanonicalPublicDisplayViewConfig,
}));

vi.mock("@/components/display-view", () => ({
  DisplayView: ({
    config,
    venueSlug,
  }: {
    config: { content: string; surface: string };
    venueSlug: string;
  }) => (
    <div data-content={config.content} data-surface={config.surface} data-venue={venueSlug}>
      public display
    </div>
  ),
}));

import PublicMenuPage from "./page";

afterEach(() => {
  vi.clearAllMocks();
});

describe("public menu page", () => {
  it("loads the canonical public display config", async () => {
    mockGetCanonicalPublicDisplayViewConfig.mockResolvedValue({
      config: {
        content: "menu",
        surface: "public",
      },
      venue: { id: "venue-1" },
      view: null,
    });

    const markup = renderToStaticMarkup(
      await PublicMenuPage({
        params: Promise.resolve({ venue: "demo-taproom" }),
      }),
    );

    expect(markup).toContain('data-content="menu"');
    expect(markup).toContain('data-surface="public"');
    expect(markup).toContain('data-venue="demo-taproom"');
  });
});

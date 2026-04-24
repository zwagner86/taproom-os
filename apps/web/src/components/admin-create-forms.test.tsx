import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { EventForm, MembershipPlanForm } from "./admin-create-forms";

describe("admin create and edit forms", () => {
  it("renders event edit mode with hidden id, prefilled details, ends-at, and save label", () => {
    const markup = renderToStaticMarkup(
      createElement(EventForm, {
        action: async () => {},
        canSellPaidEvents: true,
        defaultValues: {
          capacity: 80,
          currency: "USD",
          description: "Taproom trivia.",
          ends_at: "2026-05-03T22:00:00.000Z",
          id: "event-1",
          price_cents: 1500,
          starts_at: "2026-05-03T20:00:00.000Z",
          status: "published",
          title: "Trivia Night",
        },
        mode: "edit",
      }),
    );

    expect(markup).toContain('name="event_id"');
    expect(markup).toContain('value="event-1"');
    expect(markup).toContain("Trivia Night");
    expect(markup).toContain("Ends at");
    expect(markup).toContain("Archived");
    expect(markup).toContain("Cancelled");
    expect(markup).toContain("Save changes");
    expect(markup).not.toContain("Create event");
  });

  it("renders membership plan edit mode with hidden id, prefilled details, and save label", () => {
    const markup = renderToStaticMarkup(
      createElement(MembershipPlanForm, {
        action: async () => {},
        canSellMemberships: true,
        defaultValues: {
          active: false,
          billing_interval: "year",
          description: "Annual mug club perks.",
          id: "plan-1",
          name: "Mug Club Gold",
          price_cents: 9900,
        },
        mode: "edit",
      }),
    );

    expect(markup).toContain('name="plan_id"');
    expect(markup).toContain('value="plan-1"');
    expect(markup).toContain("Mug Club Gold");
    expect(markup).toContain("Annual mug club perks.");
    expect(markup).toContain("Save plan");
    expect(markup).not.toContain("Create plan");
  });
});

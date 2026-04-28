"use client";

import { useEffect, useState } from "react";

import { DemoMutationAlert } from "@/components/demo-mutation-alert";
import { useDemoVenue } from "@/components/demo-venue-provider";
import { Alert, Badge, Button, Card, FieldHint, FieldLabel, Input, PageHeader, Select } from "@/components/ui";
import type { DemoItemRecord, DemoMutationResult } from "@/lib/demo-venue-state";
import type { SquareConnectionRow } from "@/server/repositories/providers";
import type { VenueRow } from "@/server/repositories/venues";

type SquareSearchResult = {
  available: boolean | null;
  id: string;
  name: string;
  priceCents: number | null;
  variationName: string | null;
};

export function DemoVenueSquarePage({
  initialConnection,
  initialError,
  initialItems,
  initialQuery,
  initialResults,
  initialVenue,
}: {
  initialConnection: SquareConnectionRow | null;
  initialError?: string;
  initialItems: DemoItemRecord[];
  initialQuery: string;
  initialResults: SquareSearchResult[];
  initialVenue: VenueRow;
}) {
  const { dispatchSeedItems, state } = useDemoVenue();
  const venue = state.venue ?? initialVenue;
  const items = state.items ?? initialItems;
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [result, setResult] = useState<DemoMutationResult | null>(null);

  useEffect(() => {
    dispatchSeedItems(initialItems);
  }, [dispatchSeedItems, initialItems]);

  const statusVariant = initialConnection?.status === "active" ? "success" :
    initialConnection?.status === "error" ? "error" : "default";

  const handleDemoAction = (message: string) => {
    setError(null);
    setResult({
      detail: "Square demo actions do not reconnect, sync, or save links in the database.",
      message,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        subtitle="Link TaproomOS serving options to Square catalog variations for live price snapshots."
        title="Square Integration"
      />

      <div className="space-y-4">
        <DemoMutationAlert onDismiss={() => setResult(null)} result={result} />
        {error && (
          <Alert onDismiss={() => setError(null)} variant="error">
            {error}
          </Alert>
        )}
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_1.5fr]">
        <div className="flex flex-col gap-4">
          <Card>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>Connection status</div>
              <Badge variant={statusVariant}>
                {initialConnection?.status ?? "Not connected"}
              </Badge>
            </div>
            {initialConnection?.merchant_id && (
              <div
                className="rounded-lg px-3 py-2 text-[12px] mb-4"
                style={{ background: "var(--c-bg2)", color: "var(--c-muted)" }}
              >
                Merchant: {initialConnection.merchant_id}
              </div>
            )}
            {initialConnection?.last_error && (
              <div className="mb-4 rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-800">
                {initialConnection.last_error}
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Button className="w-full" onClick={() => handleDemoAction("Square connect previewed for demo.")} type="button">
                {initialConnection?.merchant_id ? "Reconnect Square" : "Connect Square"}
              </Button>
              {initialConnection?.status === "active" && (
                <Button className="w-full" onClick={() => handleDemoAction("Square sync previewed for demo.")} type="button" variant="secondary">
                  Sync linked items
                </Button>
              )}
            </div>
          </Card>

          <Card>
            <div className="text-sm font-semibold mb-2" style={{ color: "var(--c-text)" }}>How it works</div>
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--c-muted)" }}>
              TaproomOS keeps menu items as source records and links serving options to live Square catalog variations for price and availability snapshots.
              No mirrored catalog table, no inventory writeback.
            </p>
          </Card>
        </div>

        <div>
          <Card style={{ marginBottom: 16 }}>
            <div className="text-sm font-semibold mb-3" style={{ color: "var(--c-text)" }}>Search Square catalog</div>
            <form className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <FieldLabel
                  htmlFor="square-search"
                  info="Search looks through connected Square catalog variations, so you can find the exact item or size you want to link."
                >
                  Search query
                </FieldLabel>
                <div className="flex gap-2">
                  <Input
                    aria-describedby="square-search-hint"
                    defaultValue={initialQuery}
                    id="square-search"
                    name="q"
                    placeholder="IPA, flight, t-shirt..."
                    style={{ flex: 1 }}
                  />
                  <Button type="submit">Search</Button>
                </div>
                <FieldHint id="square-search-hint">
                  Search by item name, variation name, or keywords your staff already uses in Square.
                </FieldHint>
              </div>
            </form>
          </Card>

          {initialQuery ? (
            <div>
              <div
                className="text-[13px] font-bold uppercase tracking-[0.8px] mb-3"
                style={{ color: "var(--c-muted)" }}
              >
                Results · {initialResults.length}
              </div>
              {initialResults.length === 0 ? (
                <Card>
                  <p className="text-[13.5px]" style={{ color: "var(--c-muted)" }}>
                    No matching Square catalog variations found.
                  </p>
                </Card>
              ) : (
                <div className="flex flex-col gap-3">
                  {initialResults.map((resultRow) => (
                    <Card key={resultRow.id}>
                      <div className="mb-3">
                        <div className="font-semibold text-[14px]" style={{ color: "var(--c-text)" }}>{resultRow.name}</div>
                        <div className="text-[12.5px]" style={{ color: "var(--c-muted)" }}>
                          {resultRow.variationName ?? "Default variation"} ·{" "}
                          {resultRow.priceCents !== null ? `$${(resultRow.priceCents / 100).toFixed(2)}` : "No price"} ·{" "}
                          <Badge variant={resultRow.available === false ? "error" : "success"} style={{ fontSize: 11 }}>
                            {resultRow.available === false ? "Unavailable" : "Available"}
                          </Badge>
                        </div>
                      </div>
                      <form
                        action={async () => {
                          handleDemoAction("Square item link previewed for demo.");
                        }}
                        className="flex gap-2"
                      >
                        <input name="external_id" type="hidden" value={resultRow.id} />
                        <div className="flex-1">
                          <div className="flex flex-col gap-1">
                            <FieldLabel
                              htmlFor={`link-serving-${resultRow.id}`}
                              info="Linking connects this Square variation to one TaproomOS serving so live pricing and availability snapshots can stay in sync."
                            >
                              Link to serving
                            </FieldLabel>
                            <div className="flex gap-2">
                              <Select
                                aria-describedby={`link-serving-${resultRow.id}-hint`}
                                defaultValue=""
                                id={`link-serving-${resultRow.id}`}
                                name="item_serving_id"
                                required
                                style={{ flex: 1 }}
                              >
                                <option disabled value="">Link to serving...</option>
                                {items.map((item) => (
                                  <optgroup key={item.id} label={item.name}>
                                    {item.item_servings.map((serving) => (
                                      <option key={serving.id} value={serving.id}>
                                        {serving.label}
                                      </option>
                                    ))}
                                  </optgroup>
                                ))}
                              </Select>
                              <Button size="sm" type="submit">Link</Button>
                            </div>
                            <FieldHint id={`link-serving-${resultRow.id}-hint`}>
                              Choose the menu serving that should receive price and availability snapshots from this Square variation.
                            </FieldHint>
                          </div>
                        </div>
                      </form>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div
              className="rounded-[10px] px-4 py-3 text-[13px] text-center"
              style={{ background: "var(--c-bg2)", color: "var(--c-muted)" }}
            >
              Search to find Square catalog items and link them to TaproomOS items.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";

import { Alert, Badge, Button, Card, FieldHint, FieldLabel, Input, PageHeader, Select } from "@/components/ui";

import { DemoVenueSquarePage } from "@/components/demo-venue-square-page";
import { linkSquareItemAction, startSquareConnectAction, syncSquareItemsAction } from "@/server/actions/providers";
import { getCatalogProvider } from "@/server/providers";
import { listVenueItems } from "@/server/repositories/items";
import { getSquareConnectionForVenue } from "@/server/repositories/providers";
import { requireVenueAccess } from "@/server/repositories/venues";

export default async function VenueSquarePage({
  params,
  searchParams,
}: {
  params: Promise<{ venue: string }>;
  searchParams: Promise<{ error?: string; message?: string; q?: string }>;
}) {
  const { venue } = await params;
  const [access, { error, message, q }] = await Promise.all([
    requireVenueAccess(venue),
    searchParams,
  ]);
  const { venue: venueRecord } = access;
  const [connection, items] = await Promise.all([
    getSquareConnectionForVenue(venueRecord.id),
    listVenueItems(venueRecord.id),
  ]);
  const query = q?.trim() ?? "";
  const results =
    !access.isDemoVenue && query && connection?.status === "active"
      ? await getCatalogProvider().searchCatalog({
          query,
          venueId: venueRecord.id,
        })
      : [];
  const connectAction = startSquareConnectAction.bind(null, venue);
  const syncAction = syncSquareItemsAction.bind(null, venue);
  const linkAction = linkSquareItemAction.bind(null, venue);

  if (access.isDemoVenue) {
    return (
      <DemoVenueSquarePage
        initialConnection={connection}
        initialError={error}
        initialItems={items}
        initialQuery={query}
        initialResults={results}
        initialVenue={venueRecord}
      />
    );
  }

  const statusVariant = connection?.status === "active" ? "success" :
    connection?.status === "error" ? "error" : "default";

  return (
    <div className="space-y-6">
      <PageHeader
        subtitle="Link TaproomOS items to Square catalog variations for live price snapshots."
        title="Square Integration"
      />

      {message && <Alert variant="success">{message}</Alert>}
      {error && <Alert variant="error">{error}</Alert>}

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_1.5fr]">
        <div className="flex flex-col gap-4">
          <Card>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>Connection status</div>
              <Badge variant={statusVariant}>
                {connection?.status ?? "Not connected"}
              </Badge>
            </div>
            {connection?.merchant_id && (
              <div
                className="rounded-lg px-3 py-2 text-[12px] mb-4"
                style={{ background: "var(--c-bg2)", color: "var(--c-muted)" }}
              >
                Merchant: {connection.merchant_id}
              </div>
            )}
            {connection?.last_error && (
              <div className="mb-4 rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-800">
                {connection.last_error}
              </div>
            )}
            <div className="flex flex-col gap-2">
              <form action={connectAction}>
                <Button className="w-full" disabled={access.isDemoVenue} type="submit">
                  {connection?.merchant_id ? "Reconnect Square" : "Connect Square"}
                </Button>
              </form>
              {connection?.status === "active" && (
                <form action={syncAction}>
                  <Button className="w-full" disabled={access.isDemoVenue} type="submit" variant="secondary">
                    Sync linked items
                  </Button>
                </form>
              )}
            </div>
          </Card>

          <Card>
            <div className="text-sm font-semibold mb-2" style={{ color: "var(--c-text)" }}>How it works</div>
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--c-muted)" }}>
              TaproomOS keeps items as source records and links live Square catalog variations for price and availability snapshots.
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
                    defaultValue={query}
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

          {query ? (
            <div>
              <div
                className="text-[13px] font-bold uppercase tracking-[0.8px] mb-3"
                style={{ color: "var(--c-muted)" }}
              >
                Results · {results.length}
              </div>
              {results.length === 0 ? (
                <Card>
                  <p className="text-[13.5px]" style={{ color: "var(--c-muted)" }}>
                    No matching Square catalog variations found.
                  </p>
                </Card>
              ) : (
                <div className="flex flex-col gap-3">
                  {results.map((result) => (
                    <Card key={result.id}>
                      <div className="mb-3">
                        <div className="font-semibold text-[14px]" style={{ color: "var(--c-text)" }}>{result.name}</div>
                        <div className="text-[12.5px]" style={{ color: "var(--c-muted)" }}>
                          {result.variationName ?? "Default variation"} ·{" "}
                          {result.priceCents !== null ? `$${(result.priceCents / 100).toFixed(2)}` : "No price"} ·{" "}
                          <Badge variant={result.available === false ? "error" : "success"} style={{ fontSize: 11 }}>
                            {result.available === false ? "Unavailable" : "Available"}
                          </Badge>
                        </div>
                      </div>
                      <form action={linkAction} className="flex gap-2">
                        <fieldset className="contents" disabled={access.isDemoVenue}>
                          <input name="external_id" type="hidden" value={result.id} />
                          <div className="flex-1">
                            <div className="flex flex-col gap-1">
                              <FieldLabel
                                htmlFor={`link-item-${result.id}`}
                                info="Linking connects this Square variation to one TaproomOS menu item so live pricing and availability snapshots can stay in sync."
                              >
                                Link to TaproomOS item
                              </FieldLabel>
                              <div className="flex gap-2">
                                <Select
                                  aria-describedby={`link-item-${result.id}-hint`}
                                  defaultValue=""
                                  id={`link-item-${result.id}`}
                                  name="item_id"
                                  required
                                  style={{ flex: 1 }}
                                >
                                  <option disabled value="">Link to item…</option>
                                  {items
                                    .filter((item) => item.type !== "event")
                                    .map((item) => (
                                      <option key={item.id} value={item.id}>
                                        {item.name}
                                      </option>
                                    ))}
                                </Select>
                                <Button size="sm" type="submit">Link</Button>
                              </div>
                              <FieldHint id={`link-item-${result.id}-hint`}>
                                Choose the internal menu item that should receive price and availability snapshots from this Square variation.
                              </FieldHint>
                            </div>
                          </div>
                        </fieldset>
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

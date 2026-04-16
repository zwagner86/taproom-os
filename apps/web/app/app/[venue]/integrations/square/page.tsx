export const dynamic = "force-dynamic";

import { Button, Card, Input, Label, Select } from "@taproom/ui";

import { startSquareConnectAction, linkSquareItemAction, syncSquareItemsAction } from "@/server/actions/providers";
import { listVenueItems } from "@/server/repositories/items";
import { getSquareConnectionForVenue } from "@/server/repositories/providers";
import { requireVenueAccess } from "@/server/repositories/venues";
import { getCatalogProvider } from "@/server/providers";

export default async function VenueSquarePage({
  params,
  searchParams,
}: {
  params: Promise<{ venue: string }>;
  searchParams: Promise<{ error?: string; message?: string; q?: string }>;
}) {
  const { venue } = await params;
  const [{ venue: venueRecord }, { error, message, q }] = await Promise.all([
    requireVenueAccess(venue),
    searchParams,
  ]);
  const [connection, items] = await Promise.all([
    getSquareConnectionForVenue(venueRecord.id),
    listVenueItems(venueRecord.id),
  ]);
  const query = q?.trim() ?? "";
  const results =
    query && connection?.status === "active"
      ? await getCatalogProvider().searchCatalog({
          query,
          venueId: venueRecord.id,
        })
      : [];
  const connectAction = startSquareConnectAction.bind(null, venue);
  const syncAction = syncSquareItemsAction.bind(null, venue);
  const linkAction = linkSquareItemAction.bind(null, venue);

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Square</p>
          <h1 className="font-display text-4xl text-ink">Connection and item linking</h1>
          <p className="max-w-3xl text-sm leading-6 text-ink/65">
            TaproomOS keeps items as the source records and links live Square catalog variations for price and
            availability snapshots. No mirrored catalog table, no inventory writeback.
          </p>
        </div>
        {message ? <p className="rounded-3xl bg-pine/10 px-4 py-3 text-sm text-pine">{message}</p> : null}
        {error ? <p className="rounded-3xl bg-ember/10 px-4 py-3 text-sm text-ember">{error}</p> : null}
      </Card>

      <Card className="space-y-4">
        <p className="text-sm font-semibold text-ink">Connection status</p>
        <p className="text-sm text-ink/60">
          {connection?.status ?? "not_connected"}
          {connection?.merchant_id ? ` · Merchant ${connection.merchant_id}` : ""}
        </p>
        {connection?.last_error ? <p className="text-sm text-ember">{connection.last_error}</p> : null}
        <div className="flex flex-wrap gap-3">
          <form action={connectAction}>
            <Button type="submit">{connection?.merchant_id ? "Reconnect Square" : "Connect Square"}</Button>
          </form>
          <form action={syncAction}>
            <Button type="submit" variant="ghost">
              Sync linked items
            </Button>
          </form>
        </div>
      </Card>

      <Card>
        <form className="grid gap-4 md:grid-cols-[1fr_auto]">
          <div className="space-y-2">
            <Label htmlFor="square-query">Search connected Square catalog</Label>
            <Input defaultValue={query} id="square-query" name="q" placeholder="IPA, flight, t-shirt..." />
          </div>
          <div className="flex items-end">
            <Button type="submit">Search</Button>
          </div>
        </form>
      </Card>

      <Card className="space-y-4">
        <h2 className="font-display text-2xl text-ink">Search results</h2>
        {results.length === 0 ? (
          <p className="text-sm leading-6 text-ink/65">
            {query
              ? "No matching Square catalog variations were found for this venue."
              : "Search the connected Square catalog to link a TaproomOS item to a live Square variation."}
          </p>
        ) : (
          <div className="grid gap-3">
            {results.map((result) => (
              <Card className="space-y-4" key={result.id}>
                <div>
                  <p className="font-semibold text-ink">{result.name}</p>
                  <p className="text-sm text-ink/60">
                    {result.variationName ?? "Default variation"} ·{" "}
                    {result.priceCents !== null ? `$${(result.priceCents / 100).toFixed(2)}` : "No price"} ·{" "}
                    {result.available === false ? "Unavailable" : "Available"}
                  </p>
                </div>
                <form action={linkAction} className="grid gap-4 md:grid-cols-[1fr_auto]">
                  <input name="external_id" type="hidden" value={result.id} />
                  <div className="space-y-2">
                    <Label htmlFor={`link-item-${result.id}`}>TaproomOS item</Label>
                    <Select defaultValue="" id={`link-item-${result.id}`} name="item_id" required>
                      <option disabled value="">
                        Select an item
                      </option>
                      {items
                        .filter((item) => item.type !== "event")
                        .map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button type="submit">Link item</Button>
                  </div>
                </form>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

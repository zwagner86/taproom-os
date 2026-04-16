import type {
  CatalogSearchRequest,
  CatalogSearchResult,
  CatalogProvider,
  CatalogSyncResult,
  ConnectExchangeRequest,
  ConnectLinkRequest,
  ConnectLinkResponse,
  ConnectedAccountStatus,
  VenueItemSyncRecord,
} from "./contracts";

export class StubSquareCatalogProvider implements CatalogProvider {
  async getConnectionStatus(_venueId: string): Promise<ConnectedAccountStatus> {
    return "not_connected";
  }

  async getConnectUrl(_request: ConnectLinkRequest): Promise<ConnectLinkResponse> {
    return {
      url: "",
    };
  }

  async exchangeCode(_request: ConnectExchangeRequest): Promise<Record<string, string | boolean>> {
    return {};
  }

  async searchCatalog(_request: CatalogSearchRequest): Promise<CatalogSearchResult[]> {
    return [];
  }

  async syncItems(_venueId: string, items: VenueItemSyncRecord[]): Promise<CatalogSyncResult> {
    return {
      syncedCount: 0,
      linkedCount: items.filter((item) => item.externalId).length,
      snapshots: [],
      status: "noop",
    };
  }
}

export class SquareCatalogProvider implements CatalogProvider {
  constructor(
    private readonly applicationId: string,
    private readonly applicationSecret: string,
    private readonly environment: "sandbox" | "production",
    private readonly redirectUrl: string,
    private readonly accessTokenResolver: (venueId: string) => Promise<string>,
  ) {}

  async getConnectionStatus(venueId: string): Promise<ConnectedAccountStatus> {
    const token = await this.accessTokenResolver(venueId);
    return token ? "active" : "not_connected";
  }

  async getConnectUrl(request: ConnectLinkRequest): Promise<ConnectLinkResponse> {
    const state = encodeURIComponent(request.venueId);
    const scope = encodeURIComponent("ITEMS_READ MERCHANT_PROFILE_READ");
    const baseUrl =
      this.environment === "production"
        ? "https://connect.squareup.com/oauth2/authorize"
        : "https://connect.squareupsandbox.com/oauth2/authorize";

    return {
      url: `${baseUrl}?client_id=${encodeURIComponent(this.applicationId)}&scope=${scope}&session=false&state=${state}&redirect_uri=${encodeURIComponent(this.redirectUrl)}`,
    };
  }

  async exchangeCode(request: ConnectExchangeRequest): Promise<Record<string, string | boolean>> {
    const baseUrl =
      this.environment === "production"
        ? "https://connect.squareup.com/oauth2/token"
        : "https://connect.squareupsandbox.com/oauth2/token";

    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: this.applicationId,
        client_secret: this.applicationSecret,
        code: request.code,
        grant_type: "authorization_code",
        redirect_uri: this.redirectUrl,
      }),
    });

    if (!response.ok) {
      throw new Error(`Square token exchange failed with ${response.status}.`);
    }

    const payload = (await response.json()) as {
      access_token: string;
      merchant_id: string;
      refresh_token: string;
      expires_at?: string;
    };

    return {
      accessToken: payload.access_token,
      merchantId: payload.merchant_id,
      refreshToken: payload.refresh_token,
      expiresAt: payload.expires_at ?? "",
      status: true,
    };
  }

  async searchCatalog(request: CatalogSearchRequest): Promise<CatalogSearchResult[]> {
    const token = await this.accessTokenResolver(request.venueId);
    const response = await fetch(`${this.getApiBaseUrl()}/v2/catalog/search-catalog-items`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Square-Version": "2025-10-16",
      },
      body: JSON.stringify({
        enabled_location_ids: [],
        product_types: ["REGULAR"],
        text_query: request.query,
      }),
    });

    if (!response.ok) {
      throw new Error(`Square catalog search failed with ${response.status}.`);
    }

    const payload = (await response.json()) as {
      items?: Array<{
        id: string;
        item_data?: {
          name?: string;
          variations?: Array<{
            id: string;
            item_variation_data?: {
              available_for_booking?: boolean;
              name?: string;
              price_money?: {
                amount?: number;
                currency?: string;
              };
              sellable?: boolean;
            };
          }>;
        };
      }>;
    };

    return (payload.items ?? []).flatMap((item) =>
      (item.item_data?.variations ?? []).map((variation) => ({
        available:
          variation.item_variation_data?.sellable ?? variation.item_variation_data?.available_for_booking ?? true,
        currency: variation.item_variation_data?.price_money?.currency ?? null,
        id: variation.id,
        itemId: item.id,
        name: item.item_data?.name ?? "Square item",
        priceCents: variation.item_variation_data?.price_money?.amount ?? null,
        variationName: variation.item_variation_data?.name ?? null,
      })),
    );
  }

  async syncItems(venueId: string, items: VenueItemSyncRecord[]): Promise<CatalogSyncResult> {
    const token = await this.accessTokenResolver(venueId);
    const externalIds = items.map((item) => item.externalId).filter((value): value is string => Boolean(value));

    if (externalIds.length === 0) {
      return {
        linkedCount: 0,
        snapshots: [],
        status: "noop",
        syncedCount: 0,
      };
    }

    const response = await fetch(`${this.getApiBaseUrl()}/v2/catalog/batch-retrieve`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Square-Version": "2025-10-16",
      },
      body: JSON.stringify({
        object_ids: externalIds,
      }),
    });

    if (!response.ok) {
      throw new Error(`Square sync failed with ${response.status}.`);
    }

    const payload = (await response.json()) as {
      objects?: Array<{
        id: string;
        item_variation_data?: {
          available_for_booking?: boolean;
          price_money?: {
            amount?: number;
            currency?: string;
          };
          sellable?: boolean;
        };
      }>;
    };

    const snapshotById = new Map(
      (payload.objects ?? []).map((object) => [
        object.id,
        {
          availabilitySnapshot:
            object.item_variation_data?.sellable ?? object.item_variation_data?.available_for_booking ?? null,
          externalId: object.id,
          priceSnapshotCents: object.item_variation_data?.price_money?.amount ?? null,
          priceSnapshotCurrency: object.item_variation_data?.price_money?.currency ?? null,
        },
      ]),
    );

    return {
      linkedCount: externalIds.length,
      snapshots: externalIds
        .map((externalId) => snapshotById.get(externalId))
        .filter(
          (
            snapshot,
          ): snapshot is {
            availabilitySnapshot: boolean | null;
            externalId: string;
            priceSnapshotCents: number | null;
            priceSnapshotCurrency: string | null;
          } => Boolean(snapshot),
        ),
      status: "success",
      syncedCount: externalIds.length,
    };
  }

  private getApiBaseUrl() {
    return this.environment === "production" ? "https://connect.squareup.com" : "https://connect.squareupsandbox.com";
  }
}

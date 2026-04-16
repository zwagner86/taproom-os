import type {
  BillingInterval,
  FinanceLedgerEntry,
  ItemType,
  NotificationChannel,
  PriceSource,
  SquareCatalogResult,
} from "@taproom/domain";

export type ConnectedAccountStatus = "not_connected" | "pending" | "active";

export type CatalogSyncResult = {
  syncedCount: number;
  linkedCount: number;
  status: "noop" | "success";
  snapshots?: Array<{
    availabilitySnapshot: boolean | null;
    externalId: string;
    priceSnapshotCents: number | null;
    priceSnapshotCurrency: string | null;
  }>;
};

export type VenueItemSyncRecord = {
  itemId: string;
  itemType: ItemType;
  priceSource: PriceSource;
  externalId?: string;
};

export type CheckoutSessionRequest = {
  venueId: string;
  venueName: string;
  connectedAccountId: string;
  lineItemName: string;
  amountCents: number;
  currency: string;
  recurringInterval?: BillingInterval;
  successUrl: string;
  cancelUrl: string;
  applicationFeePercent: number;
  customerEmail?: string;
  metadata?: Record<string, string>;
  stripePriceId?: string;
};

export type CheckoutSessionResponse = {
  sessionId: string;
  checkoutUrl: string;
};

export type OutboundMessage = {
  venueId: string;
  recipient: string;
  channel: NotificationChannel;
  subject?: string;
  body: string;
  templateKey: string;
};

export type DeliveryReceipt = {
  provider: string;
  providerMessageId: string;
  status: "queued" | "sent";
};

export type ConnectLinkRequest = {
  venueId: string;
  venueName: string;
  returnUrl: string;
};

export type ConnectLinkResponse = {
  url: string;
};

export type ConnectExchangeRequest = {
  code: string;
  venueId: string;
};

export type StripeConnectionDetails = {
  accessToken: string;
  refreshToken: string;
  stripeAccountId: string;
  chargesEnabled: boolean;
  detailsSubmitted: boolean;
};

export type RefundResult = {
  refundId: string;
  status: string;
};

export type MembershipLifecycleResult = {
  status: "active" | "pending" | "past_due" | "cancelled";
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  cancelledAt: string | null;
  endedAt: string | null;
};

export type CatalogSearchResult = SquareCatalogResult;

export type CatalogSearchRequest = {
  venueId: string;
  query: string;
};

export type CatalogLinkRequest = {
  venueId: string;
  externalId: string;
};

export type WebhookProcessResult = {
  processed: boolean;
  ledgerEntries?: FinanceLedgerEntry[];
};

export type MembershipPlanPriceRequest = {
  connectedAccountId: string;
  amountCents: number;
  currency: string;
  interval: BillingInterval;
  name: string;
  description?: string | null;
};

export type MembershipPlanPriceResponse = {
  productId: string;
  priceId: string;
};

export interface PaymentsProvider {
  getConnectionStatus(venueId: string): Promise<ConnectedAccountStatus>;
  getConnectUrl(request: ConnectLinkRequest): Promise<ConnectLinkResponse>;
  exchangeConnectCode(request: ConnectExchangeRequest): Promise<StripeConnectionDetails>;
  createCheckoutSession(request: CheckoutSessionRequest): Promise<CheckoutSessionResponse>;
  createEventCheckoutSession(request: CheckoutSessionRequest): Promise<CheckoutSessionResponse>;
  createMembershipCheckoutSession(request: CheckoutSessionRequest): Promise<CheckoutSessionResponse>;
  ensureMembershipPlanPrice(request: MembershipPlanPriceRequest): Promise<MembershipPlanPriceResponse>;
  getPaymentIntentChargeId(connectedAccountId: string, paymentIntentId: string): Promise<string | null>;
  refundCharge(connectedAccountId: string, chargeId: string): Promise<RefundResult>;
  cancelMembership(connectedAccountId: string, subscriptionId: string): Promise<MembershipLifecycleResult>;
  resumeMembership(connectedAccountId: string, subscriptionId: string): Promise<MembershipLifecycleResult>;
  verifyWebhook(payload: string, signature: string): Promise<unknown>;
}

export interface CatalogProvider {
  getConnectionStatus(venueId: string): Promise<ConnectedAccountStatus>;
  getConnectUrl(request: ConnectLinkRequest): Promise<ConnectLinkResponse>;
  exchangeCode(request: ConnectExchangeRequest): Promise<Record<string, string | boolean>>;
  searchCatalog(request: CatalogSearchRequest): Promise<CatalogSearchResult[]>;
  syncItems(venueId: string, items: VenueItemSyncRecord[]): Promise<CatalogSyncResult>;
}

export interface NotificationProvider {
  readonly channel: NotificationChannel;
  send(message: OutboundMessage): Promise<DeliveryReceipt>;
}

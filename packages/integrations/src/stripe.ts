import Stripe from "stripe";

import type {
  CheckoutSessionRequest,
  CheckoutSessionResponse,
  ConnectExchangeRequest,
  ConnectLinkRequest,
  ConnectLinkResponse,
  ConnectedAccountStatus,
  MembershipPlanPriceRequest,
  MembershipPlanPriceResponse,
  MembershipLifecycleResult,
  PaymentsProvider,
  RefundResult,
  StripeConnectionDetails,
} from "./contracts";

export class StubStripePaymentsProvider implements PaymentsProvider {
  async getConnectionStatus(_venueId: string): Promise<ConnectedAccountStatus> {
    return "not_connected";
  }

  async getConnectUrl(_request: ConnectLinkRequest): Promise<ConnectLinkResponse> {
    return {
      url: "",
    };
  }

  async exchangeConnectCode(_request: ConnectExchangeRequest): Promise<StripeConnectionDetails> {
    throw new Error("Stripe not configured.");
  }

  async createCheckoutSession(request: CheckoutSessionRequest): Promise<CheckoutSessionResponse> {
    return {
      sessionId: `stub_${request.venueId}`,
      checkoutUrl: request.cancelUrl,
    };
  }

  async createEventCheckoutSession(request: CheckoutSessionRequest): Promise<CheckoutSessionResponse> {
    return this.createCheckoutSession(request);
  }

  async createMembershipCheckoutSession(request: CheckoutSessionRequest): Promise<CheckoutSessionResponse> {
    return this.createCheckoutSession(request);
  }

  async ensureMembershipPlanPrice(_request: MembershipPlanPriceRequest): Promise<MembershipPlanPriceResponse> {
    throw new Error("Stripe not configured.");
  }

  async getPaymentIntentChargeId(
    _connectedAccountId: string,
    _paymentIntentId: string,
  ): Promise<string | null> {
    return null;
  }

  async refundCharge(_connectedAccountId: string, chargeId: string): Promise<RefundResult> {
    return {
      refundId: `refund_${chargeId}`,
      status: "succeeded",
    };
  }

  async cancelMembership(_connectedAccountId: string, _subscriptionId: string): Promise<MembershipLifecycleResult> {
    return {
      cancelAtPeriodEnd: true,
      cancelledAt: null,
      currentPeriodEnd: null,
      endedAt: null,
      status: "active",
    };
  }

  async resumeMembership(_connectedAccountId: string, _subscriptionId: string): Promise<MembershipLifecycleResult> {
    return {
      cancelAtPeriodEnd: false,
      cancelledAt: null,
      currentPeriodEnd: null,
      endedAt: null,
      status: "active",
    };
  }

  async verifyWebhook(_payload: string, _signature: string): Promise<unknown> {
    return null;
  }
}

export class StripePaymentsProvider implements PaymentsProvider {
  private readonly stripe: Stripe;

  constructor(
    apiKey: string,
    private readonly connectClientId: string,
    private readonly redirectUrl: string,
    private readonly webhookSecret: string,
  ) {
    this.stripe = new Stripe(apiKey);
  }

  async getConnectionStatus(_venueId: string): Promise<ConnectedAccountStatus> {
    return "active";
  }

  async getConnectUrl(request: ConnectLinkRequest): Promise<ConnectLinkResponse> {
    const state = encodeURIComponent(request.venueId);
    return {
      url: `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${encodeURIComponent(this.connectClientId)}&scope=read_write&state=${state}&stripe_user[business_name]=${encodeURIComponent(request.venueName)}&redirect_uri=${encodeURIComponent(this.redirectUrl)}`,
    };
  }

  async exchangeConnectCode(request: ConnectExchangeRequest): Promise<StripeConnectionDetails> {
    const payload = await this.stripe.oauth.token({
      grant_type: "authorization_code",
      code: request.code,
    });

    if (payload.stripe_user_id === undefined || payload.access_token === undefined || payload.refresh_token === undefined) {
      throw new Error("Stripe OAuth response is missing account credentials.");
    }

    const account = await this.stripe.accounts.retrieve(payload.stripe_user_id);

    return {
      accessToken: payload.access_token,
      chargesEnabled: account.charges_enabled,
      detailsSubmitted: account.details_submitted,
      refreshToken: payload.refresh_token,
      stripeAccountId: payload.stripe_user_id,
    };
  }

  async createCheckoutSession(request: CheckoutSessionRequest): Promise<CheckoutSessionResponse> {
    const session = await this.stripe.checkout.sessions.create(
      {
        cancel_url: request.cancelUrl,
        customer_email: request.customerEmail,
        line_items: request.stripePriceId
          ? [
              {
                price: request.stripePriceId,
                quantity: 1,
              },
            ]
          : [
              {
                price_data: {
                  currency: request.currency,
                  product_data: {
                    name: request.lineItemName,
                  },
                  unit_amount: request.amountCents,
                },
                quantity: 1,
              },
            ],
        metadata: request.metadata,
        mode: request.recurringInterval ? "subscription" : "payment",
        payment_intent_data: request.recurringInterval
          ? undefined
          : {
              application_fee_amount: Math.round(request.amountCents * request.applicationFeePercent),
            },
        subscription_data: request.recurringInterval
          ? {
              application_fee_percent: request.applicationFeePercent * 100,
              metadata: request.metadata,
            }
          : undefined,
        success_url: request.successUrl,
      },
      {
        stripeAccount: request.connectedAccountId,
      },
    );

    if (!session.url) {
      throw new Error("Stripe Checkout did not return a redirect URL.");
    }

    return {
      checkoutUrl: session.url,
      sessionId: session.id,
    };
  }

  async createEventCheckoutSession(request: CheckoutSessionRequest): Promise<CheckoutSessionResponse> {
    return this.createCheckoutSession(request);
  }

  async createMembershipCheckoutSession(request: CheckoutSessionRequest): Promise<CheckoutSessionResponse> {
    return this.createCheckoutSession(request);
  }

  async refundCharge(connectedAccountId: string, chargeId: string): Promise<RefundResult> {
    const refund = await this.stripe.refunds.create(
      {
        charge: chargeId,
      },
      {
        stripeAccount: connectedAccountId,
      },
    );

    return {
      refundId: refund.id,
      status: refund.status ?? "pending",
    };
  }

  async getPaymentIntentChargeId(
    connectedAccountId: string,
    paymentIntentId: string,
  ): Promise<string | null> {
    const paymentIntent = await this.stripe.paymentIntents.retrieve(
      paymentIntentId,
      {},
      {
        stripeAccount: connectedAccountId,
      },
    );

    if (typeof paymentIntent.latest_charge === "string") {
      return paymentIntent.latest_charge;
    }

    return paymentIntent.latest_charge?.id ?? null;
  }

  async cancelMembership(
    connectedAccountId: string,
    subscriptionId: string,
  ): Promise<MembershipLifecycleResult> {
    const subscription = await this.stripe.subscriptions.update(
      subscriptionId,
      {
        cancel_at_period_end: true,
      },
      {
        stripeAccount: connectedAccountId,
      },
    );

    return this.mapSubscription(subscription);
  }

  async resumeMembership(
    connectedAccountId: string,
    subscriptionId: string,
  ): Promise<MembershipLifecycleResult> {
    const subscription = await this.stripe.subscriptions.update(
      subscriptionId,
      {
        cancel_at_period_end: false,
      },
      {
        stripeAccount: connectedAccountId,
      },
    );

    return this.mapSubscription(subscription);
  }

  async verifyWebhook(payload: string, signature: string): Promise<unknown> {
    return this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);
  }

  async ensureMembershipPlanPrice(request: MembershipPlanPriceRequest): Promise<MembershipPlanPriceResponse> {
    const product = await this.stripe.products.create(
      {
        description: request.description ?? undefined,
        name: request.name,
      },
      {
        stripeAccount: request.connectedAccountId,
      },
    );

    const recurring =
      request.interval === "quarter"
        ? { interval: "month" as const, interval_count: 3 }
        : { interval: request.interval as "month" | "year" };

    const price = await this.stripe.prices.create(
      {
        currency: request.currency.toLowerCase(),
        product: product.id,
        recurring,
        unit_amount: request.amountCents,
      },
      {
        stripeAccount: request.connectedAccountId,
      },
    );

    return {
      priceId: price.id,
      productId: product.id,
    };
  }

  private mapSubscription(subscription: Stripe.Subscription): MembershipLifecycleResult {
    return {
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      cancelledAt: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
      currentPeriodEnd: subscription.items.data[0]?.current_period_end
        ? new Date(subscription.items.data[0].current_period_end * 1000).toISOString()
        : null,
      endedAt: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null,
      status:
        subscription.status === "active"
          ? "active"
          : subscription.status === "past_due"
            ? "past_due"
            : subscription.status === "canceled"
              ? "cancelled"
              : "pending",
    };
  }
}

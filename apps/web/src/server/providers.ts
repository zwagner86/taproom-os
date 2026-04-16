import {
  NoopNotificationProvider,
  ResendEmailProvider,
  SquareCatalogProvider,
  StripePaymentsProvider,
  StubSquareCatalogProvider,
  StubStripePaymentsProvider,
  TwilioSmsProvider,
} from "@taproom/integrations";

import { getEnv } from "@/env";
import { getSquareAccessTokenForVenueAdmin } from "@/server/repositories/providers";

export function getPaymentsProvider() {
  const env = getEnv();

  if (env.STRIPE_SECRET_KEY && env.STRIPE_CONNECT_CLIENT_ID && env.STRIPE_WEBHOOK_SECRET) {
    return new StripePaymentsProvider(
      env.STRIPE_SECRET_KEY,
      env.STRIPE_CONNECT_CLIENT_ID,
      `${env.NEXT_PUBLIC_APP_URL}/api/stripe/connect/callback`,
      env.STRIPE_WEBHOOK_SECRET,
    );
  }

  return new StubStripePaymentsProvider();
}

export function getCatalogProvider() {
  const env = getEnv();

  if (env.SQUARE_APPLICATION_ID && env.SQUARE_APPLICATION_SECRET) {
    return new SquareCatalogProvider(
      env.SQUARE_APPLICATION_ID,
      env.SQUARE_APPLICATION_SECRET,
      env.SQUARE_ENVIRONMENT,
      `${env.NEXT_PUBLIC_APP_URL}/api/square/oauth/callback`,
      async (venueId) => getSquareAccessTokenForVenueAdmin(venueId),
    );
  }

  return new StubSquareCatalogProvider();
}

export function getEmailNotificationProvider() {
  const env = getEnv();

  if (env.RESEND_API_KEY && env.RESEND_FROM_EMAIL) {
    return new ResendEmailProvider(env.RESEND_API_KEY, env.RESEND_FROM_EMAIL);
  }

  return new NoopNotificationProvider("email");
}

export function getSmsNotificationProvider() {
  const env = getEnv();

  if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_FROM_PHONE) {
    return new TwilioSmsProvider(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN, env.TWILIO_FROM_PHONE);
  }

  return new NoopNotificationProvider("sms");
}

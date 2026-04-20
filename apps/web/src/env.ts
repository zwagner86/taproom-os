import { parseEnv } from "@taproom/config";
import { z } from "zod";

const envSchema = z.object({
  APP_ENCRYPTION_KEY: z.string().trim().min(32).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().trim().min(1),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  PLATFORM_ADMIN_EMAILS: z.string().default(""),
  SUPABASE_SECRET_KEY: z.string().trim().min(1).optional(),
  STRIPE_APPLICATION_FEE_PERCENT: z.coerce.number().default(0.08),
  STRIPE_CONNECT_CLIENT_ID: z.string().trim().optional(),
  STRIPE_SECRET_KEY: z.string().trim().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().trim().optional(),
  RESEND_API_KEY: z.string().trim().optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),
  TWILIO_ACCOUNT_SID: z.string().trim().optional(),
  TWILIO_AUTH_TOKEN: z.string().trim().optional(),
  TWILIO_FROM_PHONE: z.string().trim().optional(),
  SQUARE_APPLICATION_ID: z.string().trim().optional(),
  SQUARE_APPLICATION_SECRET: z.string().trim().optional(),
  SQUARE_ENVIRONMENT: z.enum(["sandbox", "production"]).default("sandbox"),
});

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | null = null;

export function getEnv() {
  if (!cachedEnv) {
    cachedEnv = parseEnv(envSchema, process.env);
  }
  return cachedEnv;
}

export function getPlatformAdminEmails() {
  return new Set(
    getEnv()
      .PLATFORM_ADMIN_EMAILS.split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

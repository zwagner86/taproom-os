import { NextResponse } from "next/server";

import { DEMO_VENUE_ID } from "@/lib/demo-venue";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { DEMO_MODE_MESSAGE } from "@/server/demo-venue";
import { getPaymentsProvider } from "@/server/providers";
import { upsertStripeConnectionAdmin } from "@/server/repositories/providers";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const venueId = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const supabase = await createAdminSupabaseClient();

  if (!venueId) {
    return NextResponse.redirect(new URL("/?error=Missing%20venue%20state", request.url));
  }

  if (venueId === DEMO_VENUE_ID) {
    return NextResponse.redirect(
      new URL(`/app/demo-taproom/billing?error=${encodeURIComponent(DEMO_MODE_MESSAGE)}`, request.url),
    );
  }

  const { data: venue } = await supabase.from("venues").select("slug").eq("id", venueId).maybeSingle();
  const redirectPath = venue ? `/app/${venue.slug}/billing` : "/";

  if (error) {
    return NextResponse.redirect(new URL(`${redirectPath}?error=${encodeURIComponent(error)}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL(`${redirectPath}?error=Missing%20Stripe%20authorization%20code`, request.url));
  }

  try {
    const connection = await getPaymentsProvider().exchangeConnectCode({
      code,
      venueId,
    });

    await upsertStripeConnectionAdmin({
      accessToken: connection.accessToken,
      chargesEnabled: connection.chargesEnabled,
      detailsSubmitted: connection.detailsSubmitted,
      refreshToken: connection.refreshToken,
      status: connection.chargesEnabled && connection.detailsSubmitted ? "active" : "pending",
      stripeAccountId: connection.stripeAccountId,
      venueId,
    });

    return NextResponse.redirect(new URL(`${redirectPath}?message=Stripe%20connected`, request.url));
  } catch (connectError) {
    const message = connectError instanceof Error ? connectError.message : "Unable to connect Stripe.";
    return NextResponse.redirect(new URL(`${redirectPath}?error=${encodeURIComponent(message)}`, request.url));
  }
}

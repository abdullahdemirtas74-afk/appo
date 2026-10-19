import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getStripe, isStripeEnabled, stripeMode } from "@/lib/stripe";

/** Admin / ops: Stripe connectivity status (no secrets returned). */
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  if (!isStripeEnabled()) {
    return NextResponse.json({
      enabled: false,
      mode: "off",
      account: null,
    });
  }

  try {
    const stripe = getStripe();
    const account = await stripe.accounts.retrieve();
    return NextResponse.json({
      enabled: true,
      mode: stripeMode(),
      webhookConfigured: Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim()),
      account: {
        id: account.id,
        country: account.country,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        displayName:
          account.business_profile?.name ||
          account.settings?.dashboard?.display_name ||
          null,
      },
    });
  } catch (e) {
    return NextResponse.json(
      {
        enabled: true,
        mode: stripeMode(),
        error: e instanceof Error ? e.message : "stripe_error",
      },
      { status: 502 },
    );
  }
}

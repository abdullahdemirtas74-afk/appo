import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { errorStatus } from "@/lib/actions";
import { mutate } from "@/lib/db";
import { isStripeEnabled } from "@/lib/stripe";
import {
  createProConnectAccount,
  createProLoginLink,
  createProOnboardingLink,
  proConnectReady,
  syncProStripeAccount,
} from "@/lib/stripe-connect";

export const runtime = "nodejs";

function connectSnapshot(pro: {
  stripeAccountId?: string | null;
  stripeDetailsSubmitted?: boolean;
  stripeChargesEnabled?: boolean;
  stripePayoutsEnabled?: boolean;
  stripeOnboardingComplete?: boolean;
}) {
  return {
    enabled: isStripeEnabled(),
    ready: Boolean(pro.stripeAccountId && pro.stripePayoutsEnabled),
    accountId: pro.stripeAccountId ?? null,
    detailsSubmitted: Boolean(pro.stripeDetailsSubmitted),
    chargesEnabled: Boolean(pro.stripeChargesEnabled),
    payoutsEnabled: Boolean(pro.stripePayoutsEnabled),
    onboardingComplete: Boolean(pro.stripeOnboardingComplete),
  };
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (session.role !== "pro" && session.role !== "admin") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    if (!isStripeEnabled()) {
      return NextResponse.json({ enabled: false, ready: false, accountId: null });
    }

    const snap = await mutate(async (db) => {
      const pro = db.pros.find((p) => p.userId === session.userId);
      if (!pro) throw new Error("NOT_FOUND");
      if (pro.stripeAccountId) await syncProStripeAccount(pro);
      return connectSnapshot(pro);
    });
    return NextResponse.json(snap);
  } catch (e) {
    const { status, error } = errorStatus(e);
    return NextResponse.json({ error }, { status });
  }
}

/**
 * body.action:
 * - "onboard" → create Express account if needed + Account Link URL
 * - "dashboard" → Express login link (requires completed onboarding)
 * - "sync" → refresh account flags from Stripe
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (session.role !== "pro" && session.role !== "admin") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  if (!isStripeEnabled()) {
    return NextResponse.json({ error: "STRIPE_NOT_CONFIGURED" }, { status: 503 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "onboard");

    const result = await mutate(async (db) => {
      const pro = db.pros.find((p) => p.userId === session.userId);
      const user = db.users.find((u) => u.id === session.userId);
      if (!pro || !user) throw new Error("NOT_FOUND");

      if (action === "sync") {
        await syncProStripeAccount(pro);
        return { ...connectSnapshot(pro), url: null as string | null };
      }

      if (action === "dashboard") {
        await syncProStripeAccount(pro);
        if (!proConnectReady(pro)) throw new Error("ONBOARDING_REQUIRED");
        const url = await createProLoginLink(pro);
        return { ...connectSnapshot(pro), url };
      }

      // onboard (default)
      await createProConnectAccount(pro, user);
      const url = await createProOnboardingLink(pro);
      return { ...connectSnapshot(pro), url };
    });

    return NextResponse.json(result);
  } catch (e) {
    const { status, error } = errorStatus(e);
    return NextResponse.json({ error }, { status });
  }
}

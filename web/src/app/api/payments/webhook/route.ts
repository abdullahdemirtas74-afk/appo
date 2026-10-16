import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { ensureInvoice, mutate } from "@/lib/db";
import { getStripe, isStripeEnabled } from "@/lib/stripe";
import { log } from "@/lib/logger";

export const runtime = "nodejs";

async function applyCheckoutPaid(session: Stripe.Checkout.Session) {
  const missionId = session.metadata?.missionId;
  if (!missionId) return { ok: false, reason: "no_mission" };
  const tip = Math.max(0, Math.round(Number(session.metadata?.tip ?? 0) * 100) / 100);
  const appoMode = session.metadata?.appoMode === "hold" ? "hold" : "pay";
  const pi =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id || null;

  await mutate((db) => {
    const m = db.missions.find((x) => x.id === missionId);
    if (!m) return;
    const now = new Date().toISOString();
    m.tip = tip || m.tip || 0;
    let pay = db.payments.find((p) => p.missionId === missionId && p.status !== "refunded");
    const amountCents = session.amount_total ?? Math.round((m.price + (m.supplement ?? 0) + tip) * 100);
    const amount = Math.round(amountCents) / 100;
    const baseAmt = Math.round((amount - tip) * 100) / 100;
    const commission = Math.round(baseAmt * m.commissionRate * 100) / 100;
    const proAmount = Math.round((baseAmt - commission + tip) * 100) / 100;

    if (!pay) {
      pay = {
        id: `pay_${Math.random().toString(36).slice(2, 10)}`,
        missionId,
        amount,
        commission,
        proAmount,
        status: appoMode === "hold" ? "held" : "paid",
        method: "stripe",
        createdAt: now,
        paidAt: appoMode === "hold" ? null : now,
        releaseAt: null,
        stripeSessionId: session.id,
        stripePaymentIntentId: pi,
        stripeCheckoutUrl: null,
      };
      db.payments.unshift(pay);
    } else {
      pay.amount = amount;
      pay.commission = commission;
      pay.proAmount = proAmount;
      pay.method = "stripe";
      pay.stripeSessionId = session.id;
      pay.stripePaymentIntentId = pi || pay.stripePaymentIntentId;
      pay.stripeCheckoutUrl = null;
      if (appoMode === "hold") {
        pay.status = "held";
        pay.paidAt = null;
      } else {
        pay.status = "paid";
        pay.paidAt = now;
      }
    }

    m.paymentMethod = "stripe";
    m.paymentStatus = appoMode === "hold" ? "held" : "paid";
    const invoice = ensureInvoice(db, m, now);
    if (invoice && appoMode === "pay") {
      invoice.status = "paid";
      invoice.paidAt = now;
      invoice.tip = tip;
      invoice.proAmount = proAmount;
    }
  });

  return { ok: true, missionId, appoMode };
}

export async function POST(req: Request) {
  if (!isStripeEnabled()) {
    return NextResponse.json({ error: "STRIPE_NOT_CONFIGURED" }, { status: 503 });
  }

  const stripe = getStripe();
  const raw = await req.text();
  const sig = req.headers.get("stripe-signature");
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  let event: Stripe.Event;
  try {
    if (whSecret && sig) {
      event = stripe.webhooks.constructEvent(raw, sig, whSecret);
    } else {
      // Bootstrap without webhook secret (less safe) — still parse JSON
      event = JSON.parse(raw) as Stripe.Event;
      log("warn", "stripe_webhook_unsigned", { hint: "Set STRIPE_WEBHOOK_SECRET" });
    }
  } catch (e) {
    log("warn", "stripe_webhook_invalid", { error: e instanceof Error ? e.message : "err" });
    return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status === "paid" || session.status === "complete") {
        const result = await applyCheckoutPaid(session);
        log("info", "stripe_checkout_applied", result);
      }
    }
    return NextResponse.json({ received: true });
  } catch (e) {
    log("error", "stripe_webhook_handler_failed", { error: e instanceof Error ? e.message : "err" });
    return NextResponse.json({ error: "HANDLER_FAILED" }, { status: 500 });
  }
}

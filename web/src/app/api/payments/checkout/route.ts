import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { errorStatus, getMission } from "@/lib/actions";
import { mutate, readDb } from "@/lib/db";
import { eurosToCents, getStripe, isStripeEnabled, publicBaseUrl, stripeCurrency } from "@/lib/stripe";

/**
 * Creates a Stripe Checkout Session for a mission payment (client).
 * body: { missionId, tip?, mode?: "pay" | "hold" }
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (!isStripeEnabled()) {
    return NextResponse.json({ error: "STRIPE_NOT_CONFIGURED" }, { status: 503 });
  }

  try {
    const body = await req.json();
    const missionId = String(body.missionId || "");
    const tip = Math.max(0, Math.round(Number(body.tip ?? 0) * 100) / 100);
    const mode = body.mode === "hold" ? "hold" : "pay";

    const m = await getMission(session.userId, missionId);
    if (m.clientId !== session.userId && session.role !== "admin") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    if (mode === "pay") {
      if (m.status !== "completed") return NextResponse.json({ error: "INVALID_STATE" }, { status: 400 });
      if (["paid", "held", "scheduled"].includes(m.paymentStatus)) {
        return NextResponse.json({ error: "ALREADY_PAID" }, { status: 400 });
      }
    } else if (["paid", "held", "scheduled"].includes(m.paymentStatus)) {
      return NextResponse.json({ error: "ALREADY_PAID" }, { status: 400 });
    }

    const amount =
      Math.round((m.price + (m.supplement ?? 0) - (m.promoDiscount ?? 0) + tip) * 100) / 100;
    if (amount < 0.5) return NextResponse.json({ error: "AMOUNT_TOO_LOW" }, { status: 400 });

    const db = await readDb();
    const clientUser = db.users.find((u) => u.id === m.clientId);

    const stripe = getStripe();
    const base = publicBaseUrl();
    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${base}/app/missions/${missionId}?paid=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/app/missions/${missionId}?paid=0`,
      customer_email: clientUser?.email || undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: stripeCurrency(),
            unit_amount: eurosToCents(amount),
            product_data: {
              name: `AppO · Mission ${missionId}`,
              description:
                mode === "hold"
                  ? "Paiement sécurisé séquestré chez AppO jusqu’à la fin de l’intervention"
                  : "Paiement de l’intervention AppO",
            },
          },
        },
      ],
      metadata: {
        missionId,
        tip: String(tip),
        appoMode: mode,
        userId: session.userId,
      },
      payment_intent_data: {
        metadata: {
          missionId,
          tip: String(tip),
          appoMode: mode,
        },
      },
    });

    await mutate((store) => {
      const mission = store.missions.find((x) => x.id === missionId);
      if (!mission) return;
      mission.tip = tip;
      let pay = store.payments.find((p) => p.missionId === missionId && p.status !== "refunded");
      const baseAmt = Math.round((amount - tip) * 100) / 100;
      const commission = Math.round(baseAmt * mission.commissionRate * 100) / 100;
      const proAmount = Math.round((baseAmt - commission + tip) * 100) / 100;
      if (!pay) {
        pay = {
          id: `pay_${Math.random().toString(36).slice(2, 10)}`,
          missionId,
          amount,
          commission,
          proAmount,
          status: "pending",
          method: "stripe",
          createdAt: new Date().toISOString(),
          paidAt: null,
          releaseAt: null,
          stripeSessionId: checkout.id,
          stripeCheckoutUrl: checkout.url,
          stripePaymentIntentId: typeof checkout.payment_intent === "string" ? checkout.payment_intent : null,
        };
        store.payments.unshift(pay);
      } else {
        pay.amount = amount;
        pay.commission = commission;
        pay.proAmount = proAmount;
        pay.method = "stripe";
        if (pay.status !== "paid") pay.status = "pending";
        pay.stripeSessionId = checkout.id;
        pay.stripeCheckoutUrl = checkout.url;
        pay.stripePaymentIntentId =
          typeof checkout.payment_intent === "string" ? checkout.payment_intent : pay.stripePaymentIntentId;
      }
      mission.paymentStatus = "pending";
      mission.paymentMethod = "stripe";
    });

    return NextResponse.json({
      url: checkout.url,
      sessionId: checkout.id,
      amount,
      mode,
    });
  } catch (e) {
    const { status, error } = errorStatus(e);
    return NextResponse.json({ error }, { status });
  }
}

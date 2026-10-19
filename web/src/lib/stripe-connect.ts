import type { DB, Payment, ProProfile, User } from "./types";
import { eurosToCents, getStripe, isStripeEnabled, publicBaseUrl } from "./stripe";
import { log } from "./logger";

export function proConnectReady(pro: ProProfile | null | undefined) {
  return Boolean(pro?.stripeAccountId && pro.stripePayoutsEnabled);
}

export async function syncProStripeAccount(pro: ProProfile) {
  if (!isStripeEnabled() || !pro.stripeAccountId) return pro;
  const stripe = getStripe();
  const account = await stripe.accounts.retrieve(pro.stripeAccountId);
  pro.stripeDetailsSubmitted = Boolean(account.details_submitted);
  pro.stripeChargesEnabled = Boolean(account.charges_enabled);
  pro.stripePayoutsEnabled = Boolean(account.payouts_enabled);
  pro.stripeOnboardingComplete = Boolean(
    account.details_submitted && account.charges_enabled && account.payouts_enabled,
  );
  return pro;
}

export async function createProConnectAccount(pro: ProProfile, user: User) {
  const stripe = getStripe();
  if (pro.stripeAccountId) {
    await syncProStripeAccount(pro);
    return pro.stripeAccountId;
  }
  const account = await stripe.accounts.create({
    type: "express",
    country: "FR",
    email: user.email,
    business_type: "individual",
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_profile: {
      name: pro.company || `${user.firstName} ${user.lastName}`.trim() || "Pro AppO",
      product_description: "Prestations de services à domicile via AppO",
      mcc: "1711",
      url: publicBaseUrl(),
    },
    metadata: {
      appoProId: pro.id,
      appoUserId: user.id,
      siret: pro.siret || "",
    },
  });
  pro.stripeAccountId = account.id;
  await syncProStripeAccount(pro);
  return account.id;
}

export async function createProOnboardingLink(pro: ProProfile) {
  if (!pro.stripeAccountId) throw new Error("STRIPE_ACCOUNT_MISSING");
  const stripe = getStripe();
  const base = publicBaseUrl();
  const link = await stripe.accountLinks.create({
    account: pro.stripeAccountId,
    refresh_url: `${base}/pro/revenus?connect=refresh`,
    return_url: `${base}/pro/revenus?connect=return`,
    type: "account_onboarding",
  });
  return link.url;
}

export async function createProLoginLink(pro: ProProfile) {
  if (!pro.stripeAccountId) throw new Error("STRIPE_ACCOUNT_MISSING");
  const stripe = getStripe();
  const link = await stripe.accounts.createLoginLink(pro.stripeAccountId);
  return link.url;
}

/**
 * Transfer proAmount from platform balance to the Connect Express account.
 * Returns updated payment fields (does not persist DB by itself).
 */
export async function transferToPro(
  pay: Payment,
  pro: ProProfile,
): Promise<{ ok: boolean; transferId?: string; error?: string }> {
  if (!isStripeEnabled()) return { ok: false, error: "STRIPE_OFF" };
  if (!proConnectReady(pro)) return { ok: false, error: "PRO_NOT_ONBOARDED" };
  if (pay.stripeTransferId) return { ok: true, transferId: pay.stripeTransferId };
  if (pay.proAmount < 0.5) return { ok: false, error: "AMOUNT_TOO_LOW" };

  const stripe = getStripe();
  try {
    const transfer = await stripe.transfers.create(
      {
        amount: eurosToCents(pay.proAmount),
        currency: "eur",
        destination: pro.stripeAccountId!,
        transfer_group: pay.missionId,
        metadata: {
          appoPaymentId: pay.id,
          appoMissionId: pay.missionId,
          appoProId: pro.id,
        },
        description: `AppO versement mission ${pay.missionId}`,
      },
      {
        // Idempotency avoids double-pay on retries
        idempotencyKey: `appo_transfer_${pay.id}`,
      },
    );
    return { ok: true, transferId: transfer.id };
  } catch (e) {
    const message = e instanceof Error ? e.message : "TRANSFER_FAILED";
    log("error", "stripe_transfer_failed", {
      paymentId: pay.id,
      proId: pro.id,
      error: message,
    });
    return { ok: false, error: message };
  }
}

/** Find scheduled payouts that are due and still missing a Stripe transfer. */
export function dueConnectPayouts(db: DB, now = new Date().toISOString()) {
  const t = new Date(now).getTime();
  const rows: { pay: Payment; pro: ProProfile }[] = [];
  for (const pay of db.payments) {
    if (pay.status !== "scheduled" || !pay.releaseAt) continue;
    if (new Date(pay.releaseAt).getTime() > t) continue;
    if (pay.stripeTransferId) continue;
    const m = db.missions.find((x) => x.id === pay.missionId);
    if (!m || !m.proId || m.status === "disputed" || m.status === "cancelled") continue;
    const pro = db.pros.find((p) => p.id === m.proId);
    if (!pro) continue;
    rows.push({ pay, pro });
  }
  return rows;
}

/**
 * Attempt Stripe Connect Transfers for every due scheduled payout.
 * Marks payment paid only after a successful transfer (or if already transferred).
 */
export async function processConnectPayouts(db: DB, now = new Date().toISOString()) {
  if (!isStripeEnabled()) return [] as { proUserId: string; proAmount: number }[];
  const released: { proUserId: string; proAmount: number }[] = [];

  for (const { pay, pro } of dueConnectPayouts(db, now)) {
    const result = await transferToPro(pay, pro);
    if (!result.ok || !result.transferId) {
      pay.stripeTransferError = result.error || "TRANSFER_FAILED";
      log("warn", "stripe_connect_payout_deferred", {
        paymentId: pay.id,
        proId: pro.id,
        error: pay.stripeTransferError,
      });
      continue;
    }

    pay.stripeTransferId = result.transferId;
    pay.stripeTransferError = null;
    pay.status = "paid";
    pay.paidAt = now;

    const m = db.missions.find((x) => x.id === pay.missionId);
    if (m) {
      m.paymentStatus = "paid";
      m.payoutReleaseAt = pay.releaseAt ?? now;
    }

    released.push({ proUserId: pro.userId, proAmount: pay.proAmount });
    log("info", "stripe_connect_payout_ok", {
      paymentId: pay.id,
      transferId: result.transferId,
      proId: pro.id,
      amount: pay.proAmount,
    });
  }

  return released;
}

import type { DB, Mission, Payment, ProProfile } from "./types";

export const MAX_PAYOUT_DELAY_DAYS = 30;

function nid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function clampPayoutDelay(value: unknown, fallback = 7) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(MAX_PAYOUT_DELAY_DAYS, Math.round(n)));
}

export function clientFundsCaptured(status: string | null | undefined) {
  return status === "held" || status === "scheduled" || status === "paid";
}

function amounts(m: Mission) {
  const base = Math.round((m.price + (m.supplement ?? 0) - (m.promoDiscount ?? 0)) * 100) / 100;
  const tip = Math.max(0, Math.round((m.tip ?? 0) * 100) / 100);
  const charged = Math.max(0, base);
  const commission = Math.round(charged * m.commissionRate * 100) / 100;
  const proAmount = Math.round((charged - commission + tip) * 100) / 100;
  return { amount: Math.round((charged + tip) * 100) / 100, commission, proAmount };
}

export function holdClientFunds(db: DB, m: Mission, now: string, method = "card") {
  const existing = db.payments.find((p) => p.missionId === m.id && p.status !== "refunded");
  if (existing) return existing;
  const { amount, commission, proAmount } = amounts(m);
  const payment: Payment = {
    id: nid("pay"),
    missionId: m.id,
    amount,
    commission,
    proAmount,
    status: "held",
    method: method || "card",
    createdAt: now,
    paidAt: null,
    releaseAt: null,
  };
  db.payments.unshift(payment);
  m.paymentStatus = "held";
  m.paymentMethod = payment.method;
  m.payoutReleaseAt = null;
  return payment;
}

export function syncEscrowAmount(db: DB, m: Mission) {
  const pay = db.payments.find((p) => p.missionId === m.id && (p.status === "held" || p.status === "scheduled"));
  if (!pay) return null;
  const next = amounts(m);
  pay.amount = next.amount;
  pay.commission = next.commission;
  pay.proAmount = next.proAmount;
  return pay;
}

/** After the intervention, schedule the pro payout using their delay (0–30 days). */
export function scheduleProPayout(db: DB, m: Mission, pro: ProProfile, now: string) {
  let pay = db.payments.find((p) => p.missionId === m.id && p.status !== "refunded");
  if (!pay) pay = holdClientFunds(db, m, now, m.paymentMethod ?? "card");
  if (pay.status === "paid" || pay.status === "refunded") return pay;
  syncEscrowAmount(db, m);
  const delay = clampPayoutDelay(pro.payoutDelayDays, 0);
  if (delay <= 0) {
    pay.status = "paid";
    pay.paidAt = now;
    pay.releaseAt = now;
    m.paymentStatus = "paid";
    m.payoutReleaseAt = now;
    return pay;
  }
  const release = new Date(now);
  release.setDate(release.getDate() + delay);
  const releaseAt = release.toISOString();
  pay.status = "scheduled";
  pay.releaseAt = releaseAt;
  pay.paidAt = null;
  m.paymentStatus = "scheduled";
  m.payoutReleaseAt = releaseAt;
  return pay;
}

export function releaseDuePayouts(db: DB, now = new Date().toISOString()) {
  const t = new Date(now).getTime();
  const released: { proUserId: string; proAmount: number }[] = [];
  for (const pay of db.payments) {
    if (pay.status !== "scheduled" || !pay.releaseAt) continue;
    if (new Date(pay.releaseAt).getTime() > t) continue;
    const m = db.missions.find((x) => x.id === pay.missionId);
    if (!m || m.status === "disputed" || m.status === "cancelled") continue;
    pay.status = "paid";
    pay.paidAt = now;
    m.paymentStatus = "paid";
    m.payoutReleaseAt = pay.releaseAt;
    const pro = m.proId ? db.pros.find((p) => p.id === m.proId) : null;
    if (pro) released.push({ proUserId: pro.userId, proAmount: pay.proAmount });
  }
  return released;
}

/** Refund money still held by Appo. Already released payouts stay until an explicit admin refund. */
export function refundHeldFunds(db: DB, m: Mission) {
  const pay = db.payments.find((p) => p.missionId === m.id && (p.status === "held" || p.status === "scheduled"));
  if (!pay) return null;
  pay.status = "refunded";
  m.paymentStatus = "refunded";
  m.payoutReleaseAt = null;
  return pay;
}

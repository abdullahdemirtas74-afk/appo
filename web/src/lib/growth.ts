import type {
  CatalogProduct,
  DB,
  Guarantee,
  Mission,
  MissionProduct,
  PromoCode,
  RecurringPlan,
  Settings,
  SlotPromo,
  User,
  WalletLedger,
} from "./types";

export const GROWTH_DEFAULTS = {
  referralClientCredit: 15,
  referralProCredit: 25,
  guaranteeRate: 0.05,
  guaranteeDays: 30,
  defaultSlotPromoPercent: 10,
};

export function withGrowthSettings(settings: Settings): Settings {
  return {
    ...settings,
    referralClientCredit: settings.referralClientCredit ?? GROWTH_DEFAULTS.referralClientCredit,
    referralProCredit: settings.referralProCredit ?? GROWTH_DEFAULTS.referralProCredit,
    guaranteeRate: settings.guaranteeRate ?? GROWTH_DEFAULTS.guaranteeRate,
    guaranteeDays: settings.guaranteeDays ?? GROWTH_DEFAULTS.guaranteeDays,
    defaultSlotPromoPercent: settings.defaultSlotPromoPercent ?? GROWTH_DEFAULTS.defaultSlotPromoPercent,
  };
}

export function makeReferralCode(user: Pick<User, "firstName" | "id">) {
  const base = (user.firstName || "APPO").replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase() || "APPO";
  return `${base}${user.id.replace(/\D/g, "").slice(-4) || "0000"}`;
}

export function ensureUserGrowthFields(user: User, settings: Settings): User {
  const s = withGrowthSettings(settings);
  void s;
  return {
    ...user,
    referralCode: user.referralCode || makeReferralCode(user),
    walletBalance: typeof user.walletBalance === "number" ? user.walletBalance : 0,
    referredByUserId: user.referredByUserId ?? null,
  };
}

export function creditWallet(
  db: DB,
  userId: string,
  amount: number,
  kind: WalletLedger["kind"],
  label: string,
  missionId?: string | null,
) {
  if (!Number.isFinite(amount) || amount === 0) return null;
  const user = db.users.find((u) => u.id === userId);
  if (!user) return null;
  user.walletBalance = Math.round(((user.walletBalance ?? 0) + amount) * 100) / 100;
  const entry: WalletLedger = {
    id: `wlt_${Math.random().toString(36).slice(2, 10)}`,
    userId,
    amount: Math.round(amount * 100) / 100,
    kind,
    label,
    missionId: missionId ?? null,
    createdAt: new Date().toISOString(),
  };
  if (!db.walletLedgers) db.walletLedgers = [];
  db.walletLedgers.unshift(entry);
  return entry;
}

export function applyPromoToAmount(code: PromoCode, amount: number) {
  if (code.type === "percent") {
    return Math.round(amount * (code.value / 100) * 100) / 100;
  }
  return Math.min(amount, Math.round(code.value * 100) / 100);
}

export function findActivePromo(db: DB, rawCode: string, city?: string | null) {
  const code = rawCode.trim().toUpperCase();
  const promo = (db.promoCodes ?? []).find((p) => p.code === code && p.active);
  if (!promo) return null;
  if (promo.expiresAt && new Date(promo.expiresAt).getTime() < Date.now()) return null;
  if (promo.redemptionCount >= promo.maxRedemptions) return null;
  if (promo.city && city && promo.city.toLowerCase() !== city.toLowerCase()) return null;
  return promo;
}

export function matchSlotPromo(db: DB, proId: string, at: Date): SlotPromo | null {
  const list = (db.slotPromos ?? []).filter((s) => s.proId === proId && s.active);
  const day = at.getDay();
  const hm = `${String(at.getHours()).padStart(2, "0")}:${String(at.getMinutes()).padStart(2, "0")}`;
  return (
    list.find((s) => {
      if (s.day != null && s.day !== day) return false;
      return hm >= s.start && hm <= s.end;
    }) ?? null
  );
}

export function productLineTotal(items: MissionProduct[]) {
  return items
    .filter((p) => p.status === "accepted" || p.status === "proposed")
    .reduce((a, p) => a + (p.status === "accepted" ? p.unitPrice * p.quantity : 0), 0);
}

export function acceptedProductsTotal(db: DB, missionId: string) {
  return (db.missionProducts ?? [])
    .filter((p) => p.missionId === missionId && p.status === "accepted")
    .reduce((a, p) => a + p.unitPrice * p.quantity, 0);
}

export function missionGrandTotal(m: Mission, productsExtra = 0) {
  const discount = m.promoDiscount ?? 0;
  const base = m.price + (m.supplement ?? 0) + productsExtra;
  return Math.max(0, Math.round((base - discount) * 100) / 100);
}

export function nextRecurringDate(plan: RecurringPlan, from = new Date()) {
  const d = new Date(from);
  d.setHours(Number(plan.preferredHour.split(":")[0] || 9), Number(plan.preferredHour.split(":")[1] || 0), 0, 0);
  const addDays = plan.frequency === "weekly" ? 7 : plan.frequency === "biweekly" ? 14 : 30;
  // advance until preferred weekday for weekly/biweekly
  if (plan.frequency !== "monthly") {
    while (d.getDay() !== plan.preferredDay || d.getTime() <= from.getTime()) {
      d.setDate(d.getDate() + 1);
    }
    if (plan.frequency === "biweekly" && d.getTime() - from.getTime() < 10 * 86400000) {
      d.setDate(d.getDate() + 7);
      while (d.getDay() !== plan.preferredDay) d.setDate(d.getDate() + 1);
    }
  } else {
    d.setDate(d.getDate() + addDays);
    while (d.getDay() !== plan.preferredDay) d.setDate(d.getDate() + 1);
  }
  return d.toISOString();
}

export function createGuarantee(db: DB, m: Mission, settings: Settings) {
  const s = withGrowthSettings(settings);
  const base = m.price + (m.supplement ?? 0);
  const premium = Math.round(base * s.guaranteeRate * 100) / 100;
  const expires = new Date();
  expires.setDate(expires.getDate() + s.guaranteeDays);
  const g: Guarantee = {
    id: `gar_${Math.random().toString(36).slice(2, 10)}`,
    missionId: m.id,
    clientId: m.clientId,
    premium,
    coverageAmount: Math.round(base * 100) / 100,
    status: "active",
    expiresAt: expires.toISOString(),
    claimReason: null,
    claimStatus: "none",
    createdAt: new Date().toISOString(),
  };
  if (!db.guarantees) db.guarantees = [];
  db.guarantees.unshift(g);
  m.guaranteeId = g.id;
  return g;
}

export function defaultCatalogProducts(): CatalogProduct[] {
  return [
    {
      id: "prd_robinet_grohe",
      categoryId: "cat_plomberie",
      name: "Robinet mitigeur cuisine",
      brand: "Grohe",
      model: "Eurosmart Cosmopolitan",
      quality: "premium",
      price: 189,
      unit: "pièce",
      active: true,
    },
    {
      id: "prd_robinet_sensa",
      categoryId: "cat_plomberie",
      name: "Robinet mitigeur cuisine",
      brand: "Sensea",
      model: "Start Easy",
      quality: "eco",
      price: 49,
      unit: "pièce",
      active: true,
    },
    {
      id: "prd_joint_fibre",
      categoryId: "cat_plomberie",
      name: "Joint fibre vulcanisée",
      brand: "Geb",
      model: "20x27",
      quality: "standard",
      price: 3.5,
      unit: "lot",
      active: true,
    },
    {
      id: "prd_pneu_michelin",
      categoryId: "cat_mecanique",
      name: "Pneu été",
      brand: "Michelin",
      model: "Primacy 4 205/55 R16",
      quality: "premium",
      price: 119,
      unit: "pneu",
      active: true,
    },
    {
      id: "prd_pneu_klinger",
      categoryId: "cat_mecanique",
      name: "Pneu été",
      brand: "Kleber",
      model: "Dynaxer HP4 205/55 R16",
      quality: "standard",
      price: 79,
      unit: "pneu",
      active: true,
    },
    {
      id: "prd_disjoncteur",
      categoryId: "cat_electricite",
      name: "Disjoncteur différentiel",
      brand: "Schneider",
      model: "Resi9 40A 30mA",
      quality: "premium",
      price: 68,
      unit: "pièce",
      active: true,
    },
  ];
}

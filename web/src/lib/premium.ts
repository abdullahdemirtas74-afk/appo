import type { EffectiveTier, LoyaltyBadge, ProProfile, Settings, SubscriptionTier, User } from "./types";
import { withClientPlusSettings, isClientPlusActive } from "./client-plus";

export const TIER_DEFAULTS = {
  premiumMonthlyPrice: 49,
  premiumYearlyPrice: 399,
  premiumExclusiveSeconds: 45,
  premiumOfferBonusSeconds: 10,
  primeMonthlyPrice: 49,
  primeYearlyPrice: 399,
  eliteExclusiveSeconds: 20,
  primeExclusiveSeconds: 45,
  boost24hPrice: 9,
  boost7dPrice: 29,
  urgenceCommissionBonus: 0.03,
  urgencePriceMultiplier: 1.25,
  commissionPrime: 0.12,
  commissionElite: 0.1,
};

export function withTierSettings(settings: Settings): Settings {
  const base = {
    ...settings,
    premiumMonthlyPrice: settings.premiumMonthlyPrice ?? TIER_DEFAULTS.premiumMonthlyPrice,
    premiumYearlyPrice: settings.premiumYearlyPrice ?? TIER_DEFAULTS.premiumYearlyPrice,
    premiumExclusiveSeconds: settings.premiumExclusiveSeconds ?? TIER_DEFAULTS.premiumExclusiveSeconds,
    premiumOfferBonusSeconds: settings.premiumOfferBonusSeconds ?? TIER_DEFAULTS.premiumOfferBonusSeconds,
    primeMonthlyPrice: settings.primeMonthlyPrice ?? settings.premiumMonthlyPrice ?? TIER_DEFAULTS.primeMonthlyPrice,
    primeYearlyPrice: settings.primeYearlyPrice ?? settings.premiumYearlyPrice ?? TIER_DEFAULTS.primeYearlyPrice,
    eliteExclusiveSeconds: settings.eliteExclusiveSeconds ?? TIER_DEFAULTS.eliteExclusiveSeconds,
    primeExclusiveSeconds: settings.primeExclusiveSeconds ?? settings.premiumExclusiveSeconds ?? TIER_DEFAULTS.primeExclusiveSeconds,
    boost24hPrice: settings.boost24hPrice ?? TIER_DEFAULTS.boost24hPrice,
    boost7dPrice: settings.boost7dPrice ?? TIER_DEFAULTS.boost7dPrice,
    urgenceCommissionBonus: settings.urgenceCommissionBonus ?? TIER_DEFAULTS.urgenceCommissionBonus,
    urgencePriceMultiplier: settings.urgencePriceMultiplier ?? TIER_DEFAULTS.urgencePriceMultiplier,
    commissionPrime: settings.commissionPrime ?? TIER_DEFAULTS.commissionPrime,
    commissionElite: settings.commissionElite ?? TIER_DEFAULTS.commissionElite,
  };
  return withClientPlusSettings(base);
}

/** @deprecated alias */
export const withPremiumSettings = withTierSettings;
export const PREMIUM_DEFAULTS = TIER_DEFAULTS;

export function isPrimeActive(pro: Pick<ProProfile, "primeUntil" | "premiumUntil"> | null | undefined, at = new Date()) {
  const until = pro?.primeUntil || pro?.premiumUntil;
  if (!until) return false;
  return new Date(until).getTime() > at.getTime();
}

/** @deprecated */
export const isPremiumActive = isPrimeActive;

export function isBoostActive(pro: Pick<ProProfile, "boostUntil"> | null | undefined, at = new Date()) {
  if (!pro?.boostUntil) return false;
  return new Date(pro.boostUntil).getTime() > at.getTime();
}

export function computeLoyaltyBadge(pro: Pick<ProProfile, "missionCount" | "rating" | "acceptanceRate" | "loyaltyBadge">): LoyaltyBadge {
  if (pro.loyaltyBadge === "elite") return "elite";
  if (pro.missionCount >= 40 && pro.rating >= 4.7 && pro.acceptanceRate >= 0.85) return "elite";
  if (pro.missionCount >= 15 && pro.rating >= 4.5) return "gold";
  if (pro.loyaltyBadge === "gold") return "gold";
  return "none";
}

export function effectiveTier(pro: ProProfile, at = new Date()): EffectiveTier {
  const loyalty = computeLoyaltyBadge(pro);
  if (loyalty === "elite") return "elite";
  if (isPrimeActive(pro, at) || pro.subscriptionTier === "prime") return "prime";
  return "pro";
}

export function tierRank(tier: EffectiveTier) {
  return tier === "elite" ? 3 : tier === "prime" ? 2 : 1;
}

export function matchingScore(pro: ProProfile, at = new Date()) {
  return tierRank(effectiveTier(pro, at)) * 10 + (isBoostActive(pro, at) ? 5 : 0);
}

export function commissionForPro(
  pro: ProProfile,
  settings: Settings,
  urgence = false,
  client?: Pick<User, "clientPlusUntil"> | null,
) {
  const s = withTierSettings(settings);
  const tier = effectiveTier(pro);
  let rate = s.commissionRate;
  if (tier === "prime") rate = s.commissionPrime;
  if (tier === "elite") rate = s.commissionElite;
  if (isClientPlusActive(client)) {
    rate = Math.min(rate, s.commissionClientPlus);
  }
  if (urgence) rate += s.urgenceCommissionBonus;
  return Math.min(0.35, Math.max(0.05, rate));
}

export function offerBonusSeconds(pro: ProProfile, settings: Settings) {
  const s = withTierSettings(settings);
  const tier = effectiveTier(pro);
  if (tier === "elite") return s.premiumOfferBonusSeconds + 5;
  if (tier === "prime") return s.premiumOfferBonusSeconds;
  return 0;
}

export function primeDaysLeft(pro: Pick<ProProfile, "primeUntil" | "premiumUntil"> | null | undefined, at = new Date()) {
  if (!isPrimeActive(pro, at)) return 0;
  const until = pro?.primeUntil || pro?.premiumUntil;
  if (!until) return 0;
  return Math.max(0, Math.ceil((new Date(until).getTime() - at.getTime()) / 86400000));
}

/** @deprecated */
export const premiumDaysLeft = primeDaysLeft;

export function extendPrimeUntil(current: string | null | undefined, plan: "monthly" | "yearly", from = new Date()) {
  const base =
    current && new Date(current).getTime() > from.getTime() ? new Date(current) : new Date(from);
  const days = plan === "yearly" ? 365 : 30;
  base.setDate(base.getDate() + days);
  return base.toISOString();
}

/** @deprecated */
export const extendPremiumUntil = extendPrimeUntil;

export function extendBoostUntil(current: string | null | undefined, hours: number, from = new Date()) {
  const base =
    current && new Date(current).getTime() > from.getTime() ? new Date(current) : new Date(from);
  base.setHours(base.getHours() + hours);
  return base.toISOString();
}

export function subscriptionOf(pro: ProProfile): SubscriptionTier {
  if (isPrimeActive(pro) || pro.subscriptionTier === "prime") return "prime";
  return "pro";
}

export function tierLabel(tier: EffectiveTier) {
  return tier === "elite" ? "AppO Elite" : tier === "prime" ? "AppO Prime" : "AppO Pro";
}

export function verifiedComplete(pro: ProProfile) {
  const need = ["identite", "entreprise", "assurance"] as const;
  return (
    pro.verified &&
    pro.status === "verified" &&
    need.every((t) => pro.documents.some((d) => d.type === t && d.status === "approved"))
  );
}

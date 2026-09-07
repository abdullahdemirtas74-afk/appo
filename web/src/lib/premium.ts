import type { ProProfile, Settings } from "./types";

export const PREMIUM_DEFAULTS = {
  premiumMonthlyPrice: 49,
  premiumYearlyPrice: 399,
  premiumExclusiveSeconds: 45,
  premiumOfferBonusSeconds: 10,
};

export function isPremiumActive(pro: Pick<ProProfile, "premiumUntil"> | null | undefined, at = new Date()) {
  if (!pro?.premiumUntil) return false;
  return new Date(pro.premiumUntil).getTime() > at.getTime();
}

export function premiumDaysLeft(pro: Pick<ProProfile, "premiumUntil"> | null | undefined, at = new Date()) {
  if (!isPremiumActive(pro, at) || !pro?.premiumUntil) return 0;
  return Math.max(0, Math.ceil((new Date(pro.premiumUntil).getTime() - at.getTime()) / 86400000));
}

export function withPremiumSettings(settings: Settings): Settings {
  return {
    ...settings,
    premiumMonthlyPrice: settings.premiumMonthlyPrice ?? PREMIUM_DEFAULTS.premiumMonthlyPrice,
    premiumYearlyPrice: settings.premiumYearlyPrice ?? PREMIUM_DEFAULTS.premiumYearlyPrice,
    premiumExclusiveSeconds: settings.premiumExclusiveSeconds ?? PREMIUM_DEFAULTS.premiumExclusiveSeconds,
    premiumOfferBonusSeconds: settings.premiumOfferBonusSeconds ?? PREMIUM_DEFAULTS.premiumOfferBonusSeconds,
  };
}

export function extendPremiumUntil(current: string | null | undefined, plan: "monthly" | "yearly", from = new Date()) {
  const base =
    current && new Date(current).getTime() > from.getTime() ? new Date(current) : new Date(from);
  const days = plan === "yearly" ? 365 : 30;
  base.setDate(base.getDate() + days);
  return base.toISOString();
}

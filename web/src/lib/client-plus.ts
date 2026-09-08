import type { Settings, User } from "./types";

export const CLIENT_PLUS_DEFAULTS = {
  clientPlusMonthlyPrice: 9.9,
  clientPlusYearlyPrice: 89,
  /** Commission plateforme réduite sur les missions d’un client AppO+ */
  commissionClientPlus: 0.1,
};

export function withClientPlusSettings(settings: Settings): Settings {
  return {
    ...settings,
    clientPlusMonthlyPrice: settings.clientPlusMonthlyPrice ?? CLIENT_PLUS_DEFAULTS.clientPlusMonthlyPrice,
    clientPlusYearlyPrice: settings.clientPlusYearlyPrice ?? CLIENT_PLUS_DEFAULTS.clientPlusYearlyPrice,
    commissionClientPlus: settings.commissionClientPlus ?? CLIENT_PLUS_DEFAULTS.commissionClientPlus,
  };
}

export function isClientPlusActive(
  user: Pick<User, "clientPlusUntil"> | null | undefined,
  at = new Date(),
) {
  if (!user?.clientPlusUntil) return false;
  return new Date(user.clientPlusUntil).getTime() > at.getTime();
}

export function clientPlusDaysLeft(
  user: Pick<User, "clientPlusUntil"> | null | undefined,
  at = new Date(),
) {
  if (!isClientPlusActive(user, at)) return 0;
  const until = user?.clientPlusUntil;
  if (!until) return 0;
  return Math.max(0, Math.ceil((new Date(until).getTime() - at.getTime()) / 86400000));
}

export function extendClientPlusUntil(
  current: string | null | undefined,
  plan: "monthly" | "yearly",
  from = new Date(),
) {
  const base =
    current && new Date(current).getTime() > from.getTime() ? new Date(current) : new Date(from);
  base.setDate(base.getDate() + (plan === "yearly" ? 365 : 30));
  return base.toISOString();
}

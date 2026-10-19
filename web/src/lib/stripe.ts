import Stripe from "stripe";
import { getMarket } from "./market";

let cached: Stripe | null | undefined;

export function stripeMode(): "live" | "test" | "off" {
  const key = process.env.STRIPE_SECRET_KEY?.trim() || "";
  if (!key) return "off";
  if (process.env.STRIPE_MODE === "test" || key.startsWith("sk_test_")) return "test";
  return "live";
}

export function isStripeEnabled() {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new Error("STRIPE_NOT_CONFIGURED");
  if (cached === undefined || cached === null) {
    cached = new Stripe(key, { typescript: true });
  }
  return cached;
}

export function publicBaseUrl() {
  const fromEnv = process.env.APPO_PUBLIC_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (process.env.RAILWAY_PUBLIC_DOMAIN) return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  return "https://appo-ad.com";
}

/** Stripe currency code for the active market (lowercase). */
export function stripeCurrency() {
  return getMarket().currency.toLowerCase();
}

/** Minor units for Stripe (cents). Min ~0.50 in major currency. */
export function eurosToCents(amount: number) {
  return Math.max(50, Math.round(amount * 100));
}

/** Connect Express country — FR default when market is multi-country. */
export function stripeConnectCountry() {
  const code = getMarket().countryCode?.trim().toUpperCase();
  if (code && /^[A-Z]{2}$/.test(code)) return code;
  return "FR";
}

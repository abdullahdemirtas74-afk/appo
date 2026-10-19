import Stripe from "stripe";

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

export function eurosToCents(amount: number) {
  return Math.max(50, Math.round(amount * 100)); // Stripe min ~0.50 EUR
}

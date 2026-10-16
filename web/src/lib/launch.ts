/**
 * Official launch mode helpers.
 * In production builds, demo UI / simulated payments are off unless NEXT_PUBLIC_APPO_DEMO_UI=true.
 */

export function isProductionRuntime() {
  return process.env.NODE_ENV === "production";
}

/**
 * Soft-launch / local demo: comptes démo, reset, paiement simulé.
 * Prefer NEXT_PUBLIC_APPO_DEMO_UI so client + server agree after build.
 * Server-only APPO_DEMO_UI also accepted.
 */
export function isDemoUiEnabled() {
  const pub = process.env.NEXT_PUBLIC_APPO_DEMO_UI?.trim().toLowerCase();
  if (pub === "1" || pub === "true") return true;
  if (pub === "0" || pub === "false") return false;
  const priv = process.env.APPO_DEMO_UI?.trim().toLowerCase();
  if (priv === "1" || priv === "true") return true;
  if (priv === "0" || priv === "false") return false;
  return !isProductionRuntime();
}

export function launchSnapshot() {
  return {
    mode: isDemoUiEnabled() ? ("demo" as const) : ("official" as const),
    demoUi: isDemoUiEnabled(),
    publicUrl: (process.env.APPO_PUBLIC_URL || "https://appo-ad.com").replace(/\/$/, ""),
  };
}

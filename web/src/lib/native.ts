/** Capacitor / native shell helpers (safe to import from web). */

type CapBrowser = { open: (opts: { url: string }) => Promise<void> };
type CapStatusBar = {
  setStyle?: (opts: { style: string }) => Promise<void>;
  setBackgroundColor?: (opts: { color: string }) => Promise<void>;
};
type CapPlugins = {
  Browser?: CapBrowser;
  StatusBar?: CapStatusBar;
};
type CapBridge = {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
  Plugins?: CapPlugins;
};

function cap(): CapBridge | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as Window & { Capacitor?: CapBridge }).Capacitor;
}

/** True when running inside the Capacitor iOS/Android shell. */
export function isNativeApp(): boolean {
  const c = cap();
  if (!c) return false;
  try {
    if (typeof c.isNativePlatform === "function") return c.isNativePlatform();
  } catch {
    /* ignore */
  }
  return false;
}

export function nativePlatform(): "ios" | "android" | "web" {
  if (!isNativeApp()) return "web";
  const p = cap()?.getPlatform?.() ?? "";
  if (p === "ios") return "ios";
  if (p === "android") return "android";
  return "web";
}

/** Open http(s) links outside the WebView when in the native shell. */
export async function openExternal(url: string): Promise<void> {
  const browser = cap()?.Plugins?.Browser;
  if (browser?.open) {
    await browser.open({ url });
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

export function isExternalUrl(href: string): boolean {
  if (!href || href.startsWith("/") || href.startsWith("#") || href.startsWith("?")) {
    return false;
  }
  if (href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("sms:")) {
    return true;
  }
  try {
    const u = new URL(href, window.location.origin);
    return u.origin !== window.location.origin;
  } catch {
    return false;
  }
}

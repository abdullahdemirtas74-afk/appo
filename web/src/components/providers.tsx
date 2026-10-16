"use client";

import { useEffect, type ReactNode } from "react";
import { NativeBridge } from "@/components/native-bridge";
import { LocaleProvider } from "@/lib/i18n";
import { isNativeApp } from "@/lib/native";

function registerPwa() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (process.env.NODE_ENV === "development") return;
  // Capacitor shell already wraps the site — skip PWA SW to avoid double caching.
  if (isNativeApp()) return;
  void navigator.serviceWorker.register("/sw.js").catch(() => {
    /* ignore offline/register errors */
  });
}

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    registerPwa();
  }, []);
  return (
    <LocaleProvider>
      <NativeBridge />
      {children}
    </LocaleProvider>
  );
}

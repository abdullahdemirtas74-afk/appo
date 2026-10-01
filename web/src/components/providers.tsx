"use client";

import { useEffect, type ReactNode } from "react";
import { LocaleProvider } from "@/lib/i18n";

function registerPwa() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (process.env.NODE_ENV === "development") return;
  void navigator.serviceWorker.register("/sw.js").catch(() => {
    /* ignore offline/register errors */
  });
}

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    registerPwa();
  }, []);
  return <LocaleProvider>{children}</LocaleProvider>;
}

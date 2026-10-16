"use client";

import { useEffect } from "react";
import { isExternalUrl, isNativeApp, openExternal } from "@/lib/native";

/**
 * Marks the document for native shell CSS and intercepts external links
 * so they open in the system browser (Capacitor Browser plugin).
 */
export function NativeBridge() {
  useEffect(() => {
    if (!isNativeApp()) return;

    document.documentElement.classList.add("app-native");
    document.body.classList.add("app-native");

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;

      const href = anchor.getAttribute("href");
      if (!href || !isExternalUrl(href)) return;

      event.preventDefault();
      void openExternal(anchor.href);
    };

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.documentElement.classList.remove("app-native");
      document.body.classList.remove("app-native");
    };
  }, []);

  return null;
}

"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { usePoll } from "@/lib/hooks";
import { useLocale } from "@/lib/i18n";
import type { PublicUser, Address, AppNotification, Favorite, ProProfile, Settings } from "@/lib/types";

export type Me = {
  user: PublicUser | null;
  addresses?: Address[];
  notifications?: AppNotification[];
  favorites?: Favorite[];
  unread?: number;
  settings?: Settings;
  pro?: ProProfile | null;
  clientPlusActive?: boolean;
  clientPlusDaysLeft?: number;
  walletBalance?: number;
  referralCode?: string;
};

export function useMe() {
  return usePoll<Me>("/api/me", 8000);
}

export function Guard({
  role,
  children,
}: {
  role: "client" | "pro" | "admin";
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data, loading } = useMe();
  const { setLocale } = useLocale();

  useEffect(() => {
    if (loading) return;
    if (!data?.user) {
      router.replace("/login");
      return;
    }
    if (data.user.role !== role) {
      const dest = data.user.role === "admin" ? "/admin" : data.user.role === "pro" ? "/pro" : "/app";
      router.replace(dest);
      return;
    }
    if (role === "client" || role === "pro") {
      const needsOnboarding = data.user.onboardingCompletedAt == null;
      const onOnboarding = pathname?.includes("/onboarding");
      const isHome = pathname === "/app" || pathname === "/pro";
      if (needsOnboarding && isHome && !onOnboarding) {
        router.replace(role === "pro" ? "/pro/onboarding" : "/app/onboarding");
      }
    }
  }, [data, loading, role, router, pathname]);

  useEffect(() => {
    const loc = data?.user?.locale;
    if (loc) setLocale(loc);
  }, [data?.user?.locale, setLocale]);

  if (loading || !data?.user || data.user.role !== role) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background text-sm text-muted">
        Chargement…
      </div>
    );
  }
  return <>{children}</>;
}

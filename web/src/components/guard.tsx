"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { usePoll } from "@/lib/hooks";
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
  const { data, loading } = useMe();

  useEffect(() => {
    if (loading) return;
    if (!data?.user) {
      router.replace("/login");
      return;
    }
    if (data.user.role !== role) {
      const dest = data.user.role === "admin" ? "/admin" : data.user.role === "pro" ? "/pro" : "/app";
      router.replace(dest);
    }
  }, [data, loading, role, router]);

  if (loading || !data?.user || data.user.role !== role) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background text-sm text-muted">
        Chargement…
      </div>
    );
  }
  return <>{children}</>;
}

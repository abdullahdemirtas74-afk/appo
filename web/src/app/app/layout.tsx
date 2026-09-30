"use client";

import { Guard } from "@/components/guard";
import { CLIENT_MOBILE_NAV, CLIENT_NAV } from "@/components/nav";
import { AppShell } from "@/components/shell";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <Guard role="client">
      <AppShell
        items={CLIENT_NAV}
        mobileItems={CLIENT_MOBILE_NAV}
        root="/app"
        title="Espace client"
      >
        {children}
      </AppShell>
    </Guard>
  );
}

"use client";

import { Guard } from "@/components/guard";
import { CLIENT_NAV } from "@/components/nav";
import { AppShell } from "@/components/shell";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <Guard role="client">
      <AppShell items={CLIENT_NAV} root="/app" title="Espace client" facturesHref="/app/factures">
        {children}
      </AppShell>
    </Guard>
  );
}

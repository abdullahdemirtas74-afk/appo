"use client";

import { usePathname } from "next/navigation";
import { Guard } from "@/components/guard";
import { CLIENT_MOBILE_NAV, CLIENT_NAV } from "@/components/nav";
import { AppShell } from "@/components/shell";

function ClientChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/app/onboarding")) return <>{children}</>;
  return (
    <AppShell items={CLIENT_NAV} mobileItems={CLIENT_MOBILE_NAV} root="/app" title="Espace client">
      {children}
    </AppShell>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <Guard role="client">
      <ClientChrome>{children}</ClientChrome>
    </Guard>
  );
}

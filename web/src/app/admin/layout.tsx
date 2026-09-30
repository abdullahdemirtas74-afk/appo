"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Guard } from "@/components/guard";
import { Logo } from "@/components/logo";
import { api } from "@/lib/hooks";

const links = [
  ["/admin", "Vue d’ensemble"],
  ["/admin/pros", "Professionnels"],
  ["/admin/clients", "Clients"],
  ["/admin/emails", "E-mails Pros"],
  ["/admin/missions", "Missions"],
  ["/admin/paiements", "Paiements"],
  ["/admin/promos", "Codes promo"],
  ["/admin/garanties", "Garanties"],
  ["/admin/categories", "Services"],
  ["/admin/litiges", "Litiges"],
  ["/admin/reglages", "Réglages"],
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  return (
    <Guard role="admin">
      <div className="min-h-dvh overflow-x-hidden bg-[#f3eee6]">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-line bg-white p-5 lg:block">
          <Logo size="sm" />
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted">Admin AppO</p>
          <nav className="mt-6 space-y-1">
            {links.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className={`block rounded-xl px-3 py-2 text-sm font-semibold ${
                  path === href ? "bg-ink text-white" : "text-ink/70 hover:bg-background"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
          <button
            className="mt-8 text-sm text-muted"
            onClick={async () => {
              await api("/api/auth/logout", {});
              router.replace("/");
            }}
          >
            Déconnexion
          </button>
        </aside>
        <div className="lg:pl-60">
          <div className="sticky top-0 z-20 border-b border-line bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
            <div className="mb-2 flex items-center justify-between">
              <Logo size="sm" />
              <button
                className="text-sm text-muted"
                onClick={async () => {
                  await api("/api/auth/logout", {});
                  router.replace("/");
                }}
              >
                Déconnexion
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {links.map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                    path === href ? "bg-ink text-white" : "bg-background text-ink"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
          <div className="p-4 sm:p-6 md:p-8">{children}</div>
        </div>
      </div>
    </Guard>
  );
}

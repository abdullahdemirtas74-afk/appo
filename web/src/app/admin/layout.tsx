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
  ["/admin/missions", "Missions"],
  ["/admin/paiements", "Paiements"],
  ["/admin/categories", "Services"],
  ["/admin/litiges", "Litiges"],
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  return (
    <Guard role="admin">
      <div className="min-h-dvh bg-[#f3eee6]">
        <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-line bg-white p-5 md:block">
          <Logo size="sm" />
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted">Admin AppO</p>
          <nav className="mt-6 space-y-1">
            {links.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className={`block rounded-xl px-3 py-2 text-sm font-semibold ${path === href ? "bg-ink text-white" : "text-ink/70 hover:bg-background"}`}
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
        <div className="md:pl-60">
          <div className="flex gap-2 overflow-x-auto border-b border-line bg-white px-4 py-3 md:hidden">
            {links.map(([href, label]) => (
              <Link key={href} href={href} className="shrink-0 rounded-full bg-background px-3 py-1 text-xs font-semibold">
                {label}
              </Link>
            ))}
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    </Guard>
  );
}

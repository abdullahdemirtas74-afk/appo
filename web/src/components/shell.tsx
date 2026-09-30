"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Logo } from "@/components/logo";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

function isActive(path: string, href: string, root: string) {
  if (href === root) return path === root;
  return path === href || path.startsWith(`${href}/`);
}

function SideLink({ item, root }: { item: NavItem; root: string }) {
  const path = usePathname();
  const on = isActive(path, item.href, root);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
        on ? "bg-ink text-white" : "text-ink/70 hover:bg-background hover:text-ink"
      }`}
    >
      <Icon size={18} />
      {item.label}
    </Link>
  );
}

function CompactLink({
  item,
  root,
  mode,
}: {
  item: NavItem;
  root: string;
  mode: "bottom" | "top";
}) {
  const path = usePathname();
  const on = isActive(path, item.href, root);
  const Icon = item.icon;
  if (mode === "top") {
    return (
      <Link
        href={item.href}
        className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold transition ${
          on ? "bg-ink text-white" : "bg-card text-muted hover:text-ink"
        }`}
      >
        <Icon size={16} />
        {item.label}
      </Link>
    );
  }
  return (
    <Link
      href={item.href}
      className={`flex w-[4.5rem] shrink-0 flex-col items-center gap-1 px-1 py-2 text-[11px] font-semibold sm:text-xs ${
        on ? "text-appo" : "text-muted"
      }`}
    >
      <Icon size={22} className="shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

export function AppShell({
  items,
  root,
  title,
  children,
  overlay,
}: {
  items: NavItem[];
  root: string;
  title: string;
  children: React.ReactNode;
  overlay?: React.ReactNode;
}) {
  return (
    <div className="app-shell relative min-h-dvh overflow-x-hidden bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-card p-5 lg:flex xl:w-64">
        <Logo size="sm" />
        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {items.map((item) => (
            <SideLink key={item.href} item={item} root={root} />
          ))}
        </nav>
        <p className="text-xs text-muted">Le bon pro, sans attendre</p>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-col lg:pl-60 xl:pl-64">
        <header className="sticky top-0 z-20 hidden border-b border-line bg-card/95 px-4 py-3 backdrop-blur md:block lg:hidden">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
            <div className="min-w-0">
              <Logo size="sm" />
              <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted">{title}</p>
            </div>
          </div>
          <nav className="mx-auto mt-3 flex max-w-5xl gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {items.map((item) => (
              <CompactLink key={item.href} item={item} root={root} mode="top" />
            ))}
          </nav>
        </header>

        <main className="page-frame mx-auto w-full min-w-0 max-w-5xl flex-1 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-8 lg:pb-10">
          {children}
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-20 flex overflow-x-auto border-t border-line bg-card/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((item) => (
            <CompactLink key={item.href} item={item} root={root} mode="bottom" />
          ))}
        </nav>
      </div>

      {overlay}
    </div>
  );
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh overflow-x-hidden bg-background">
      <div className="mx-auto grid min-h-dvh w-full max-w-6xl lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative hidden overflow-hidden bg-ink px-8 py-10 text-white md:px-10 md:py-12 lg:flex lg:flex-col lg:justify-between">
          <Logo light />
          <div>
            <h1 className="max-w-md text-3xl font-extrabold leading-tight tracking-tight xl:text-4xl">
              Votre besoin.
              <br />
              <span className="text-appo">Le bon pro.</span>
            </h1>
            <p className="mt-4 max-w-sm text-white/65">
              Des pros vérifiés près de chez vous — AppO Now, devis et paiement sécurisé.
            </p>
          </div>
          <p className="text-sm text-white/40">AppO · Rumilly & alentours</p>
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-appo/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        </div>
        <div className="flex items-start justify-center px-4 py-6 sm:px-8 sm:py-10 lg:items-center lg:py-12">
          <div className="w-full max-w-md md:max-w-lg lg:max-w-md">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function Page({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8 ${className}`}>{children}</div>;
}

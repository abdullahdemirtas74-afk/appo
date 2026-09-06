"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  CircleUser,
  ClipboardList,
  Home,
  LayoutDashboard,
  MessageCircle,
  Wallet,
} from "lucide-react";

function Item({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof Home;
  label: string;
}) {
  const path = usePathname();
  const active = path === href || (href !== "/app" && href !== "/pro" && path.startsWith(href));
  const homeActive = href === "/app" && path === "/app";
  const proHome = href === "/pro" && path === "/pro";
  const on = href === "/app" ? homeActive : href === "/pro" ? proHome : active;
  return (
    <Link
      href={href}
      className={`flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-semibold ${on ? "text-appo" : "text-muted"}`}
    >
      <Icon size={22} />
      {label}
    </Link>
  );
}

export function ClientNav() {
  return (
    <nav className="sticky bottom-0 z-20 flex border-t border-line bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <Item href="/app" icon={Home} label="Accueil" />
      <Item href="/app/missions" icon={ClipboardList} label="Missions" />
      <Item href="/app/messages" icon={MessageCircle} label="Messages" />
      <Item href="/app/compte" icon={CircleUser} label="Compte" />
    </nav>
  );
}

export function ProNav() {
  return (
    <nav className="sticky bottom-0 z-20 flex border-t border-line bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <Item href="/pro" icon={LayoutDashboard} label="Accueil" />
      <Item href="/pro/missions" icon={ClipboardList} label="Missions" />
      <Item href="/pro/planning" icon={Calendar} label="Planning" />
      <Item href="/pro/revenus" icon={Wallet} label="Revenus" />
      <Item href="/pro/profil" icon={CircleUser} label="Profil" />
    </nav>
  );
}

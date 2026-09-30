import {
  Building2,
  Calendar,
  CircleUser,
  ClipboardList,
  Crown,
  FileText,
  Home,
  LayoutDashboard,
  MessageCircle,
  Receipt,
  Sparkles,
  Wallet,
} from "lucide-react";
import type { NavItem } from "@/components/shell";

export const CLIENT_NAV: NavItem[] = [
  { href: "/app", label: "Accueil", icon: Home },
  { href: "/app/assistant", label: "Assistant", icon: Sparkles },
  { href: "/app/missions", label: "Missions", icon: ClipboardList },
  { href: "/app/factures", label: "Factures", icon: Receipt },
  { href: "/app/wallet", label: "Wallet", icon: Wallet },
  { href: "/app/messages", label: "Messages", icon: MessageCircle },
  { href: "/app/compte", label: "Compte", icon: CircleUser },
];

/** Nav complète (sidebar desktop / onglets tablette) */
export const PRO_NAV: NavItem[] = [
  { href: "/pro", label: "Accueil", icon: LayoutDashboard },
  { href: "/pro/demandes", label: "Demandes", icon: FileText },
  { href: "/pro/missions", label: "Missions", icon: ClipboardList },
  { href: "/pro/factures", label: "Factures", icon: Receipt },
  { href: "/pro/planning", label: "Planning", icon: Calendar },
  { href: "/pro/premium", label: "Offres", icon: Crown },
  { href: "/pro/business", label: "Business", icon: Building2 },
  { href: "/pro/revenus", label: "Stats", icon: Wallet },
  { href: "/pro/profil", label: "Profil", icon: CircleUser },
];

/**
 * Barre du bas téléphone — max 5 pour que Factures reste visible
 * sans faire défiler.
 */
export const PRO_MOBILE_NAV: NavItem[] = [
  { href: "/pro", label: "Accueil", icon: LayoutDashboard },
  { href: "/pro/demandes", label: "Demandes", icon: FileText },
  { href: "/pro/missions", label: "Missions", icon: ClipboardList },
  { href: "/pro/factures", label: "Factures", icon: Receipt },
  { href: "/pro/profil", label: "Profil", icon: CircleUser },
];

/** Client téléphone — Factures toujours visible */
export const CLIENT_MOBILE_NAV: NavItem[] = [
  { href: "/app", label: "Accueil", icon: Home },
  { href: "/app/missions", label: "Missions", icon: ClipboardList },
  { href: "/app/factures", label: "Factures", icon: Receipt },
  { href: "/app/messages", label: "Messages", icon: MessageCircle },
  { href: "/app/compte", label: "Compte", icon: CircleUser },
];

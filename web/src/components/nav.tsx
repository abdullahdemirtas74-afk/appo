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
  Wallet,
} from "lucide-react";
import type { NavItem } from "@/components/shell";

export const CLIENT_NAV: NavItem[] = [
  { href: "/app", label: "Accueil", icon: Home },
  { href: "/app/demandes", label: "Demandes", icon: FileText },
  { href: "/app/missions", label: "Missions", icon: ClipboardList },
  { href: "/app/plus", label: "AppO+", icon: Crown },
  { href: "/app/messages", label: "Messages", icon: MessageCircle },
  { href: "/app/compte", label: "Compte", icon: CircleUser },
];

export const PRO_NAV: NavItem[] = [
  { href: "/pro", label: "Accueil", icon: LayoutDashboard },
  { href: "/pro/demandes", label: "Demandes", icon: FileText },
  { href: "/pro/missions", label: "Missions", icon: ClipboardList },
  { href: "/pro/planning", label: "Planning", icon: Calendar },
  { href: "/pro/premium", label: "Offres", icon: Crown },
  { href: "/pro/business", label: "Business", icon: Building2 },
  { href: "/pro/revenus", label: "Stats", icon: Wallet },
  { href: "/pro/profil", label: "Profil", icon: CircleUser },
];

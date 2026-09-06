"use client";

import {
  Calendar,
  CircleUser,
  ClipboardList,
  Home,
  LayoutDashboard,
  MessageCircle,
  Wallet,
} from "lucide-react";
import type { NavItem } from "@/components/shell";

export const CLIENT_NAV: NavItem[] = [
  { href: "/app", label: "Accueil", icon: Home },
  { href: "/app/missions", label: "Missions", icon: ClipboardList },
  { href: "/app/messages", label: "Messages", icon: MessageCircle },
  { href: "/app/compte", label: "Compte", icon: CircleUser },
];

export const PRO_NAV: NavItem[] = [
  { href: "/pro", label: "Accueil", icon: LayoutDashboard },
  { href: "/pro/missions", label: "Missions", icon: ClipboardList },
  { href: "/pro/planning", label: "Planning", icon: Calendar },
  { href: "/pro/revenus", label: "Revenus", icon: Wallet },
  { href: "/pro/profil", label: "Profil", icon: CircleUser },
];

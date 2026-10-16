import { isDemoUiEnabled } from "./launch";

export const DEMO_PASSWORD = "appo123";

export type DemoAccount = {
  email: string;
  password: string;
  role: string;
  name: string;
};

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { email: "sarah@appo.fr", password: DEMO_PASSWORD, role: "Particulier AppO+", name: "Sarah Martin" },
  { email: "marc@appo.fr", password: DEMO_PASSWORD, role: "Entreprise", name: "Marc Dupont — Dupont & Fils" },
  { email: "claire@appo.fr", password: DEMO_PASSWORD, role: "Syndicat", name: "Claire Bernard — Syndic Les Alpes" },
  { email: "kevin@appo.fr", password: DEMO_PASSWORD, role: "AppO Pro", name: "Kevin Petit" },
  { email: "admin@appo.fr", password: DEMO_PASSWORD, role: "Admin", name: "Léa Moreau" },
  { email: "thomas@appo.fr", password: DEMO_PASSWORD, role: "Pro en attente", name: "Thomas Durand" },
];

/** Comptes démo visibles uniquement hors prod (ou APPO_DEMO_UI=true). */
export function publicDemoAccounts(): DemoAccount[] {
  if (!isDemoUiEnabled()) return [];
  return DEMO_ACCOUNTS;
}

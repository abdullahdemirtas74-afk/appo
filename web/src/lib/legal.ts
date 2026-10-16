/** Publisher / legal constants — single source for site + stores. */

export const LEGAL = {
  brand: "AppO",
  tagline: "Le bon pro, sans attendre",
  legalName: "AppO SAS",
  legalForm: "Société par actions simplifiée (SAS)",
  /** Remplace par ton SIRET officiel dès que tu l’as (14 chiffres). */
  siret: "En cours d’immatriculation",
  capital: "Capital social variable — en cours de constitution",
  addressLine: "Rumilly",
  zip: "74150",
  city: "Rumilly",
  country: "France",
  region: "Haute-Savoie",
  publisher: "Abdullah Demirtas",
  supportEmail: "aide@appo.fr",
  contactEmail: "contact@appo.fr",
  phone: null as string | null,
  publicUrl: "https://appo-ad.com",
  host: "Railway (cloud)",
  appId: "com.appo.app",
  updated: "16 octobre 2026",
} as const;

export const LEGAL_LINKS = [
  { href: "/confidentialite", label: "Confidentialité" },
  { href: "/cgu", label: "CGU" },
  { href: "/remboursement", label: "Remboursements" },
  { href: "/mentions-legales", label: "Mentions légales" },
] as const;

export function legalAddress() {
  return `${LEGAL.addressLine}, ${LEGAL.zip} ${LEGAL.city}, ${LEGAL.country}`;
}

/** Publisher / legal constants — single source for site + stores. Market overlays region copy. */

import { getMarket } from "./market";

const LEGAL_BASE = {
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
  supportEmail: "contact@appo-ad.com",
  contactEmail: "contact@appo-ad.com",
  phone: null as string | null,
  publicUrl: "https://appo-ad.com",
  host: "Railway (cloud)",
  appId: "com.appo.app",
  updated: "16 octobre 2026",
} as const;

export function getLegal() {
  const m = getMarket();
  return {
    ...LEGAL_BASE,
    tagline: m.tagline || LEGAL_BASE.tagline,
    region: m.regionLabel || LEGAL_BASE.region,
    country:
      m.countryCode === "CH"
        ? "Suisse"
        : m.countryCode === "FR"
          ? "France"
          : m.international
            ? "International"
            : LEGAL_BASE.country,
    governingLaw: m.governingLaw,
    areaBlurb: m.areaBlurb,
    currency: m.currency,
    marketId: m.id,
  };
}

/** @deprecated Prefer getLegal() for market-aware values */
export const LEGAL = LEGAL_BASE;

export const LEGAL_LINKS = [
  { href: "/confidentialite", label: "Confidentialité" },
  { href: "/cgu", label: "CGU" },
  { href: "/remboursement", label: "Remboursements" },
  { href: "/mentions-legales", label: "Mentions légales" },
] as const;

export function legalAddress() {
  return `${LEGAL.addressLine}, ${LEGAL.zip} ${LEGAL.city}, ${LEGAL.country}`;
}

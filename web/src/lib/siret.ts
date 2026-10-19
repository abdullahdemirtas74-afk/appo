/**
 * SIRET validation — Luhn (14 digits) + API Recherche d'entreprises (data.gouv).
 */

export type SiretLookup = {
  ok: boolean;
  siret: string;
  status: "valid" | "invalid" | "inactive" | "not_found" | "error";
  legalName: string | null;
  siren: string | null;
  naf: string | null;
  address: string | null;
  administrativelyActive: boolean;
  error?: string;
};

export function normalizeSiret(raw: string): string {
  return String(raw || "").replace(/\D/g, "");
}

/** French SIRET: 14 digits, Luhn checksum. */
export function isValidSiretLuhn(raw: string): boolean {
  const siret = normalizeSiret(raw);
  if (!/^\d{14}$/.test(siret)) return false;
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let n = Number(siret[i]);
    if (i % 2 === 0) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return sum % 10 === 0;
}

export async function lookupSiret(raw: string): Promise<SiretLookup> {
  const siret = normalizeSiret(raw);
  if (!isValidSiretLuhn(siret)) {
    return {
      ok: false,
      siret,
      status: "invalid",
      legalName: null,
      siren: null,
      naf: null,
      address: null,
      administrativelyActive: false,
      error: "SIRET_INVALID",
    };
  }

  try {
    const url = `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(siret)}&page=1&per_page=5`;
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "AppO/1.0 (https://appo-ad.com)" },
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      return {
        ok: false,
        siret,
        status: "error",
        legalName: null,
        siren: siret.slice(0, 9),
        naf: null,
        address: null,
        administrativelyActive: false,
        error: `SIRET_API_${res.status}`,
      };
    }
    const data = (await res.json()) as {
      results?: Array<{
        siren?: string;
        nom_complet?: string;
        nom_raison_sociale?: string;
        etat_administratif?: string;
        activite_principale?: string;
        siege?: {
          siret?: string;
          geo_adresse?: string;
          adresse?: string;
          libelle_commune?: string;
          code_postal?: string;
        };
        matching_etablissements?: Array<{ siret?: string; etat_administratif?: string }>;
      }>;
    };

    const results = data.results ?? [];
    const match =
      results.find((r) => r.siege?.siret === siret) ||
      results.find((r) => (r.matching_etablissements ?? []).some((e) => e.siret === siret)) ||
      results.find((r) => r.siren === siret.slice(0, 9)) ||
      results[0];

    if (!match) {
      return {
        ok: false,
        siret,
        status: "not_found",
        legalName: null,
        siren: siret.slice(0, 9),
        naf: null,
        address: null,
        administrativelyActive: false,
        error: "SIRET_NOT_FOUND",
      };
    }

    const etabState =
      match.siege?.siret === siret
        ? match.etat_administratif
        : (match.matching_etablissements ?? []).find((e) => e.siret === siret)?.etat_administratif ||
          match.etat_administratif;
    const active = String(etabState || "A").toUpperCase() === "A";
    const legalName = match.nom_complet || match.nom_raison_sociale || null;
    const address =
      match.siege?.geo_adresse ||
      [match.siege?.adresse, match.siege?.code_postal, match.siege?.libelle_commune].filter(Boolean).join(" ") ||
      null;

    if (!active) {
      return {
        ok: false,
        siret,
        status: "inactive",
        legalName,
        siren: match.siren || siret.slice(0, 9),
        naf: match.activite_principale || null,
        address,
        administrativelyActive: false,
        error: "SIRET_INACTIVE",
      };
    }

    return {
      ok: true,
      siret,
      status: "valid",
      legalName,
      siren: match.siren || siret.slice(0, 9),
      naf: match.activite_principale || null,
      address,
      administrativelyActive: true,
    };
  } catch (e) {
    return {
      ok: false,
      siret,
      status: "error",
      legalName: null,
      siren: siret.slice(0, 9),
      naf: null,
      address: null,
      administrativelyActive: false,
      error: e instanceof Error ? e.message : "SIRET_LOOKUP_FAILED",
    };
  }
}

export const VERIFY_DELAY_MS = 24 * 60 * 60 * 1000;

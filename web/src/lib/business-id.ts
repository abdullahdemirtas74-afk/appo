/**
 * Pro business registration ID by market (SIRET, UID CH, VAT, company number…).
 */

import { getMarket, type BusinessIdKind } from "./market";
import { lookupSiret, normalizeSiret, type SiretLookup } from "./siret";

export type BusinessIdLookup = SiretLookup & { kind: BusinessIdKind };

export function normalizeBusinessId(raw: string, kind: BusinessIdKind): string {
  const s = String(raw || "").trim();
  if (kind === "siret") return normalizeSiret(s);
  if (kind === "uid_ch") {
    return s.replace(/\s+/g, "").toUpperCase();
  }
  if (kind === "vat") {
    return s.replace(/\s+/g, "").toUpperCase();
  }
  return s.replace(/\s+/g, " ").trim();
}

function lookupCompanyNumber(raw: string, kind: BusinessIdKind): BusinessIdLookup {
  const id = normalizeBusinessId(raw, kind);
  const minLen = kind === "uid_ch" ? 8 : 4;
  if (id.length < minLen) {
    return {
      ok: false,
      kind,
      siret: id,
      status: "invalid",
      legalName: null,
      siren: null,
      naf: null,
      address: null,
      administrativelyActive: false,
      error: "BUSINESS_ID_INVALID",
    };
  }
  if (kind === "uid_ch") {
    const digits = id.replace(/\D/g, "");
    const okUid = /CHE/i.test(id) || (digits.length >= 9 && digits.length <= 12);
    if (!okUid) {
      return {
        ok: false,
        kind,
        siret: id,
        status: "invalid",
        legalName: null,
        siren: null,
        naf: null,
        address: null,
        administrativelyActive: false,
        error: "BUSINESS_ID_INVALID",
      };
    }
  }
  return {
    ok: true,
    kind,
    siret: id,
    status: "valid",
    legalName: null,
    siren: null,
    naf: null,
    address: null,
    administrativelyActive: true,
  };
}

/** Validate business ID according to current market. */
export async function lookupBusinessId(raw: string): Promise<BusinessIdLookup> {
  const market = getMarket();
  const kind = market.businessId.kind;
  if (kind === "none") {
    return {
      ok: true,
      kind,
      siret: "",
      status: "valid",
      legalName: null,
      siren: null,
      naf: null,
      address: null,
      administrativelyActive: true,
    };
  }
  if (kind === "siret") {
    const r = await lookupSiret(raw);
    return { ...r, kind };
  }
  return lookupCompanyNumber(raw, kind);
}

export function businessIdErrorCode(lookup: BusinessIdLookup): string {
  if (lookup.kind === "siret") {
    if (lookup.status === "inactive") return "SIRET_INACTIVE";
    if (lookup.status === "not_found") return "SIRET_NOT_FOUND";
    return "SIRET_INVALID";
  }
  return "BUSINESS_ID_INVALID";
}

export function businessIdRequiredError(): string {
  const kind = getMarket().businessId.kind;
  return kind === "siret" ? "SIRET_REQUIRED" : "BUSINESS_ID_REQUIRED";
}

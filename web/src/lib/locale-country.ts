/**
 * Map ISO 3166-1 alpha-2 country → UI language (ISO 639-1).
 * Used for automatic locale from market country or GPS / browser region.
 */

const COUNTRY_LOCALE: Record<string, string> = {
  // French-speaking
  FR: "fr",
  BE: "fr",
  LU: "fr",
  MC: "fr",
  SN: "fr",
  CI: "fr",
  CM: "fr",
  MA: "fr",
  TN: "fr",
  DZ: "fr",
  CD: "fr",
  CG: "fr",
  GA: "fr",
  BJ: "fr",
  BF: "fr",
  ML: "fr",
  NE: "fr",
  TG: "fr",
  HT: "fr",
  // Switzerland — default French (romandie); DE/IT via browser region if needed
  CH: "fr",
  // English
  US: "en",
  GB: "en",
  UK: "en",
  IE: "en",
  CA: "en",
  AU: "en",
  NZ: "en",
  ZA: "en",
  IN: "en",
  SG: "en",
  PH: "en",
  NG: "en",
  KE: "en",
  GH: "en",
  // Spanish
  ES: "es",
  MX: "es",
  AR: "es",
  CO: "es",
  CL: "es",
  PE: "es",
  VE: "es",
  EC: "es",
  GT: "es",
  CU: "es",
  BO: "es",
  DO: "es",
  HN: "es",
  PY: "es",
  SV: "es",
  NI: "es",
  CR: "es",
  PA: "es",
  UY: "es",
  // German
  DE: "de",
  AT: "de",
  LI: "de",
  // Italian
  IT: "it",
  SM: "it",
  VA: "it",
  // Portuguese
  PT: "pt",
  BR: "pt-BR",
  AO: "pt",
  MZ: "pt",
  // Arabic
  SA: "ar",
  AE: "ar",
  EG: "ar",
  QA: "ar",
  KW: "ar",
  BH: "ar",
  OM: "ar",
  JO: "ar",
  LB: "ar",
  IQ: "ar",
  SY: "ar",
  YE: "ar",
  LY: "ar",
  SD: "ar",
  MR: "ar",
  // Turkish
  TR: "tr",
  CY: "tr",
  // Others with dict coverage → English fallback handled by i18n
  NL: "en",
  PL: "en",
  SE: "en",
  NO: "en",
  DK: "en",
  FI: "en",
  CZ: "en",
  RO: "en",
  HU: "en",
  GR: "en",
  JP: "en",
  KR: "en",
  CN: "en",
  TW: "en",
  HK: "en",
  TH: "en",
  VN: "en",
  ID: "en",
  MY: "en",
  RU: "en",
  UA: "en",
  IL: "en",
};

/** Country display name (EN/FR) → ISO code, for Photon labels. */
const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  france: "FR",
  switzerland: "CH",
  suisse: "CH",
  schweiz: "CH",
  svizzera: "CH",
  belgium: "BE",
  belgique: "BE",
  "united states": "US",
  usa: "US",
  "united kingdom": "GB",
  england: "GB",
  spain: "ES",
  españa: "ES",
  espagne: "ES",
  germany: "DE",
  deutschland: "DE",
  allemagne: "DE",
  italy: "IT",
  italia: "IT",
  italie: "IT",
  portugal: "PT",
  brazil: "BR",
  brasil: "BR",
  brésil: "BR",
  canada: "CA",
  mexico: "MX",
  méxico: "MX",
  argentina: "AR",
  morocco: "MA",
  maroc: "MA",
  tunisia: "TN",
  tunisie: "TN",
  algeria: "DZ",
  algérie: "DZ",
  turkey: "TR",
  türkiye: "TR",
  turquie: "TR",
  "saudi arabia": "SA",
  "united arab emirates": "AE",
  egypt: "EG",
  egypte: "EG",
  netherlands: "NL",
  paysbas: "NL",
  austria: "AT",
  autriche: "AT",
  ireland: "IE",
  irlande: "IE",
  australia: "AU",
  australie: "AU",
  "new zealand": "NZ",
  japan: "JP",
  china: "CN",
  inde: "IN",
  india: "IN",
};

export function normalizeCountryCode(raw: string | null | undefined): string | null {
  const c = String(raw || "")
    .trim()
    .toUpperCase();
  if (!c) return null;
  if (c === "UK") return "GB";
  if (/^[A-Z]{2}$/.test(c)) return c;
  return null;
}

export function localeFromCountry(countryCode: string | null | undefined): string | null {
  const code = normalizeCountryCode(countryCode);
  if (!code) return null;
  return COUNTRY_LOCALE[code] ?? "en";
}

export function countryFromName(name: string | null | undefined): string | null {
  if (!name) return null;
  const key = name.trim().toLowerCase();
  if (COUNTRY_NAME_TO_CODE[key]) return COUNTRY_NAME_TO_CODE[key];
  // partial match
  for (const [n, code] of Object.entries(COUNTRY_NAME_TO_CODE)) {
    if (key.includes(n) || n.includes(key)) return code;
  }
  return null;
}

/** Prefer region in BCP47 tags (fr-BE → BE → fr, en-US → US → en). */
export function localeFromBrowserLanguages(
  languages: readonly string[] | undefined,
): { locale: string; countryCode: string | null } {
  const list = languages?.length ? languages : typeof navigator !== "undefined" ? navigator.languages : ["en"];
  for (const tag of list) {
    const parts = String(tag || "").replace("_", "-").split("-");
    const lang = parts[0]?.toLowerCase();
    const region = parts[1] ? normalizeCountryCode(parts[1]) : null;
    if (region) {
      const fromCountry = localeFromCountry(region);
      if (fromCountry) return { locale: fromCountry, countryCode: region };
    }
    if (lang && /^[a-z]{2,3}$/.test(lang)) {
      return { locale: lang === "pt" ? "pt" : lang, countryCode: region };
    }
  }
  return { locale: "en", countryCode: null };
}

export function resolveAutoLocale(opts: {
  marketCountryCode?: string | null;
  marketDefaultLocale?: string | null;
  gpsCountryCode?: string | null;
  browserLanguages?: readonly string[];
}): { locale: string; countryCode: string | null; source: "market" | "gps" | "browser" | "default" } {
  const marketCountry = normalizeCountryCode(opts.marketCountryCode);
  if (marketCountry) {
    const loc =
      localeFromCountry(marketCountry) ||
      (opts.marketDefaultLocale?.split("-")[0] ?? "en");
    return { locale: loc, countryCode: marketCountry, source: "market" };
  }

  const gps = normalizeCountryCode(opts.gpsCountryCode);
  if (gps) {
    return {
      locale: localeFromCountry(gps) || "en",
      countryCode: gps,
      source: "gps",
    };
  }

  const fromBrowser = localeFromBrowserLanguages(opts.browserLanguages);
  if (fromBrowser.locale) {
    return { ...fromBrowser, source: "browser" };
  }

  const fallback = opts.marketDefaultLocale?.split("-")[0] || "en";
  return { locale: fallback, countryCode: null, source: "default" };
}

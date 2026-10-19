/**
 * AppO market / international configuration.
 *
 * Env:
 *   APPO_MARKET=fr-haute-savoie | fr | ch | intl | world
 *   APPO_CURRENCY=EUR|USD|GBP|CHF|...
 *   APPO_DEFAULT_LOCALE=fr|en|...
 *   APPO_COUNTRY=FR|CH|  (empty = multi-country)
 *   APPO_MAX_SERVICE_KM=45
 *   APPO_GEO_BIAS_LAT / APPO_GEO_BIAS_LNG
 *   APPO_REGION_LABEL=Haute-Savoie
 *   NEXT_PUBLIC_APPO_MARKET=… (client hint, optional)
 */

import { localeFromCountry } from "./locale-country";

export type ServiceCity = {
  id: string;
  name: string;
  slug: string;
  lat: number;
  lng: number;
  zipHint?: string;
};

export type BusinessIdKind = "siret" | "uid_ch" | "vat" | "company_number" | "none";

export type MarketId = "fr-haute-savoie" | "fr" | "ch" | "intl" | "world";

export type MarketConfig = {
  id: MarketId;
  label: string;
  /** ISO country; empty string = multi-country / international */
  countryCode: string;
  regionLabel: string;
  defaultLocale: string;
  currency: string;
  currencyLocale: string;
  timeZone: string;
  vatRate: number;
  phoneDefaultRegion: string;
  geocodeBias: { lat: number; lng: number };
  geocodeLang: string;
  /** Soft country filter for Photon/Nominatim (empty = worldwide) */
  geocodeCountryCodes: string;
  maxServiceKm: number;
  /** Empty = GPS / free address only (no city whitelist) */
  cities: ServiceCity[];
  businessId: {
    kind: BusinessIdKind;
    label: string;
    required: boolean;
    hint: string;
  };
  tagline: string;
  areaBlurb: string;
  governingLaw: string;
  international: boolean;
};

const HAUTE_SAVOIE_CITIES: ServiceCity[] = [
  { id: "city_rumilly", name: "Rumilly", slug: "rumilly", lat: 45.8782, lng: 6.0581, zipHint: "74150" },
  { id: "city_annecy", name: "Annecy", slug: "annecy", lat: 45.8992, lng: 6.1294, zipHint: "74000" },
  { id: "city_seynod", name: "Seynod", slug: "seynod", lat: 45.8881, lng: 6.0961, zipHint: "74600" },
  { id: "city_cran", name: "Cran-Gevrier", slug: "cran-gevrier", lat: 45.909, lng: 6.1105, zipHint: "74960" },
  { id: "city_annemasse", name: "Annemasse", slug: "annemasse", lat: 46.1931, lng: 6.237, zipHint: "74100" },
  { id: "city_thonon", name: "Thonon-les-Bains", slug: "thonon", lat: 46.3705, lng: 6.4796, zipHint: "74200" },
  { id: "city_cluses", name: "Cluses", slug: "cluses", lat: 46.0614, lng: 6.5794, zipHint: "74300" },
  { id: "city_sallanches", name: "Sallanches", slug: "sallanches", lat: 45.9442, lng: 6.6316, zipHint: "74700" },
];

const FRANCE_CITIES: ServiceCity[] = [
  ...HAUTE_SAVOIE_CITIES,
  { id: "city_paris", name: "Paris", slug: "paris", lat: 48.8566, lng: 2.3522, zipHint: "75001" },
  { id: "city_lyon", name: "Lyon", slug: "lyon", lat: 45.764, lng: 4.8357, zipHint: "69001" },
  { id: "city_marseille", name: "Marseille", slug: "marseille", lat: 43.2965, lng: 5.3698, zipHint: "13001" },
  { id: "city_lille", name: "Lille", slug: "lille", lat: 50.6292, lng: 3.0573, zipHint: "59000" },
  { id: "city_bordeaux", name: "Bordeaux", slug: "bordeaux", lat: 44.8378, lng: -0.5792, zipHint: "33000" },
  { id: "city_toulouse", name: "Toulouse", slug: "toulouse", lat: 43.6047, lng: 1.4442, zipHint: "31000" },
  { id: "city_nantes", name: "Nantes", slug: "nantes", lat: 47.2184, lng: -1.5536, zipHint: "44000" },
  { id: "city_strasbourg", name: "Strasbourg", slug: "strasbourg", lat: 48.5734, lng: 7.7521, zipHint: "67000" },
];

const CH_CITIES: ServiceCity[] = [
  { id: "city_geneva", name: "Genève", slug: "geneva", lat: 46.2044, lng: 6.1432, zipHint: "1201" },
  { id: "city_lausanne", name: "Lausanne", slug: "lausanne", lat: 46.5197, lng: 6.6323, zipHint: "1003" },
  { id: "city_zurich", name: "Zürich", slug: "zurich", lat: 47.3769, lng: 8.5417, zipHint: "8001" },
  { id: "city_bern", name: "Bern", slug: "bern", lat: 46.948, lng: 7.4474, zipHint: "3011" },
  { id: "city_basel", name: "Basel", slug: "basel", lat: 47.5596, lng: 7.5886, zipHint: "4051" },
];

const PRESETS: Record<MarketId, MarketConfig> = {
  "fr-haute-savoie": {
    id: "fr-haute-savoie",
    label: "France — Haute-Savoie",
    countryCode: "FR",
    regionLabel: "Haute-Savoie",
    defaultLocale: "fr",
    currency: "EUR",
    currencyLocale: "fr-FR",
    timeZone: "Europe/Paris",
    vatRate: 0.2,
    phoneDefaultRegion: "FR",
    geocodeBias: { lat: 45.9, lng: 6.13 },
    geocodeLang: "fr",
    geocodeCountryCodes: "fr",
    maxServiceKm: 45,
    cities: HAUTE_SAVOIE_CITIES,
    businessId: {
      kind: "siret",
      label: "SIRET",
      required: true,
      hint: "14 chiffres — vérifié automatiquement (registre français)",
    },
    tagline: "Le bon pro, sans attendre",
    areaBlurb: "Rumilly, Annecy & alentours",
    governingLaw: "Droit français",
    international: false,
  },
  fr: {
    id: "fr",
    label: "France (national)",
    countryCode: "FR",
    regionLabel: "France",
    defaultLocale: "fr",
    currency: "EUR",
    currencyLocale: "fr-FR",
    timeZone: "Europe/Paris",
    vatRate: 0.2,
    phoneDefaultRegion: "FR",
    geocodeBias: { lat: 46.6, lng: 2.4 },
    geocodeLang: "fr",
    geocodeCountryCodes: "fr",
    maxServiceKm: 80,
    cities: FRANCE_CITIES,
    businessId: {
      kind: "siret",
      label: "SIRET",
      required: true,
      hint: "14 chiffres — vérifié automatiquement",
    },
    tagline: "Le bon pro, partout en France",
    areaBlurb: "Toute la France",
    governingLaw: "Droit français",
    international: false,
  },
  ch: {
    id: "ch",
    label: "Suisse",
    countryCode: "CH",
    regionLabel: "Suisse",
    defaultLocale: "fr",
    currency: "CHF",
    currencyLocale: "fr-CH",
    timeZone: "Europe/Zurich",
    vatRate: 0.081,
    phoneDefaultRegion: "CH",
    geocodeBias: { lat: 46.8, lng: 8.2 },
    geocodeLang: "fr",
    geocodeCountryCodes: "ch",
    maxServiceKm: 60,
    cities: CH_CITIES,
    businessId: {
      kind: "uid_ch",
      label: "UID / IDE",
      required: true,
      hint: "Numéro d’identification des entreprises (CHE…)",
    },
    tagline: "Le bon pro, sans attendre",
    areaBlurb: "Suisse romande & villes principales",
    governingLaw: "Droit suisse",
    international: false,
  },
  intl: {
    id: "intl",
    label: "International",
    countryCode: "",
    regionLabel: "International",
    defaultLocale: "en",
    currency: "EUR",
    currencyLocale: "en-US",
    timeZone: "UTC",
    vatRate: 0,
    phoneDefaultRegion: "",
    geocodeBias: { lat: 48.85, lng: 2.35 },
    geocodeLang: "en",
    geocodeCountryCodes: "",
    maxServiceKm: 120,
    cities: [],
    businessId: {
      kind: "company_number",
      label: "Company registration ID",
      required: true,
      hint: "Business / tax ID for your country (VAT, EIN, Companies House…)",
    },
    tagline: "The right pro, right away",
    areaBlurb: "Worldwide — GPS addresses",
    governingLaw: "Applicable local law",
    international: true,
  },
  world: {
    id: "world",
    label: "Worldwide",
    countryCode: "",
    regionLabel: "Worldwide",
    defaultLocale: "en",
    currency: "USD",
    currencyLocale: "en-US",
    timeZone: "UTC",
    vatRate: 0,
    phoneDefaultRegion: "",
    geocodeBias: { lat: 40.7, lng: -74.0 },
    geocodeLang: "en",
    geocodeCountryCodes: "",
    maxServiceKm: 150,
    cities: [],
    businessId: {
      kind: "company_number",
      label: "Business ID",
      required: true,
      hint: "Local business / tax registration number",
    },
    tagline: "The right pro, right away",
    areaBlurb: "Worldwide",
    governingLaw: "Applicable local law",
    international: true,
  },
};

function resolveMarketId(): MarketId {
  const raw = (
    process.env.APPO_MARKET ||
    process.env.NEXT_PUBLIC_APPO_MARKET ||
    "fr-haute-savoie"
  )
    .trim()
    .toLowerCase();
  if (raw === "france" || raw === "fr-national") return "fr";
  if (raw === "switzerland" || raw === "suisse") return "ch";
  if (raw === "international" || raw === "global") return "intl";
  if (raw === "worldwide" || raw === "ww") return "world";
  if (raw in PRESETS) return raw as MarketId;
  return "fr-haute-savoie";
}

let cached: MarketConfig | null = null;

export function getMarket(): MarketConfig {
  if (cached) return cached;
  const base = { ...PRESETS[resolveMarketId()] };
  const currency = (
    process.env.APPO_CURRENCY ||
    process.env.NEXT_PUBLIC_APPO_CURRENCY ||
    ""
  )
    .trim()
    .toUpperCase();
  if (currency && /^[A-Z]{3}$/.test(currency)) {
    base.currency = currency;
  }
  const locale = process.env.APPO_DEFAULT_LOCALE?.trim();
  if (locale) {
    base.defaultLocale = locale;
    if (!process.env.APPO_CURRENCY) {
      base.currencyLocale = locale.includes("-") ? locale : `${locale}-${base.countryCode || "US"}`;
    }
  }
  const country = process.env.APPO_COUNTRY?.trim().toUpperCase();
  if (country !== undefined && process.env.APPO_COUNTRY !== undefined) {
    base.countryCode = country;
    base.geocodeCountryCodes = country.toLowerCase();
    base.international = !country;
  }
  // Keep defaultLocale aligned with country when not explicitly overridden
  if (!process.env.APPO_DEFAULT_LOCALE?.trim() && base.countryCode) {
    const fromCountry = localeFromCountry(base.countryCode);
    if (fromCountry) base.defaultLocale = fromCountry;
  }
  const km = Number(process.env.APPO_MAX_SERVICE_KM);
  if (Number.isFinite(km) && km > 0) base.maxServiceKm = km;
  const lat = Number(process.env.APPO_GEO_BIAS_LAT);
  const lng = Number(process.env.APPO_GEO_BIAS_LNG);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    base.geocodeBias = { lat, lng };
  }
  const region = process.env.APPO_REGION_LABEL?.trim();
  if (region) {
    base.regionLabel = region;
    base.areaBlurb = region;
  }
  cached = base;
  return base;
}

/** Public snapshot for /api/market and client. */
export function marketPublicSnapshot() {
  const m = getMarket();
  return {
    id: m.id,
    label: m.label,
    countryCode: m.countryCode || null,
    regionLabel: m.regionLabel,
    defaultLocale: m.defaultLocale,
    currency: m.currency,
    currencyLocale: m.currencyLocale,
    timeZone: m.timeZone,
    vatRate: m.vatRate,
    maxServiceKm: m.maxServiceKm,
    international: m.international,
    tagline: m.tagline,
    areaBlurb: m.areaBlurb,
    governingLaw: m.governingLaw,
    businessId: m.businessId,
    cities: m.cities.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      lat: c.lat,
      lng: c.lng,
      zipHint: c.zipHint ?? null,
    })),
    geocode: {
      bias: m.geocodeBias,
      lang: m.geocodeLang,
      countryCodes: m.geocodeCountryCodes || null,
    },
  };
}

export function listMarketPresets() {
  return Object.values(PRESETS).map((m) => ({
    id: m.id,
    label: m.label,
    international: m.international,
    currency: m.currency,
    countryCode: m.countryCode || null,
  }));
}

export function marketServiceCities(): ServiceCity[] {
  return getMarket().cities;
}

export function marketDefaultCity(): ServiceCity {
  const cities = marketServiceCities();
  if (cities[0]) return cities[0];
  const m = getMarket();
  return {
    id: "city_local",
    name: m.international ? "Local" : m.regionLabel,
    slug: "local",
    lat: m.geocodeBias.lat,
    lng: m.geocodeBias.lng,
  };
}

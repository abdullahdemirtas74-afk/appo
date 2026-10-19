/** Villes desservies — pilotées par le marché (`APPO_MARKET`). */

import {
  getMarket,
  marketDefaultCity,
  marketServiceCities,
  type ServiceCity,
} from "./market";

export type { ServiceCity };

/** Fallback historique Haute-Savoie (seed / défaut). */
export const HAUTE_SAVOIE_CITIES: ServiceCity[] = [
  { id: "city_rumilly", name: "Rumilly", slug: "rumilly", lat: 45.8782, lng: 6.0581, zipHint: "74150" },
  { id: "city_annecy", name: "Annecy", slug: "annecy", lat: 45.8992, lng: 6.1294, zipHint: "74000" },
  { id: "city_seynod", name: "Seynod", slug: "seynod", lat: 45.8881, lng: 6.0961, zipHint: "74600" },
  { id: "city_cran", name: "Cran-Gevrier", slug: "cran-gevrier", lat: 45.909, lng: 6.1105, zipHint: "74960" },
  { id: "city_annemasse", name: "Annemasse", slug: "annemasse", lat: 46.1931, lng: 6.237, zipHint: "74100" },
  { id: "city_thonon", name: "Thonon-les-Bains", slug: "thonon", lat: 46.3705, lng: 6.4796, zipHint: "74200" },
  { id: "city_cluses", name: "Cluses", slug: "cluses", lat: 46.0614, lng: 6.5794, zipHint: "74300" },
  { id: "city_sallanches", name: "Sallanches", slug: "sallanches", lat: 45.9442, lng: 6.6316, zipHint: "74700" },
];

/** @deprecated Prefer getServiceCities() — kept for seed & static imports. */
export const SERVICE_CITIES: ServiceCity[] = HAUTE_SAVOIE_CITIES;

/** Cities for pickers — empty when market is GPS-only (intl/world). */
export function getSelectableCities(): ServiceCity[] {
  return marketServiceCities();
}

export function getServiceCities(): ServiceCity[] {
  const fromMarket = marketServiceCities();
  if (fromMarket.length > 0) return fromMarket;
  // International: synthetic local city from bias (address/GPS is source of truth)
  return [marketDefaultCity()];
}

export const RUMILLY = {
  lat: HAUTE_SAVOIE_CITIES[0].lat,
  lng: HAUTE_SAVOIE_CITIES[0].lng,
  city: HAUTE_SAVOIE_CITIES[0].name,
};

export function findCityByName(name: string | null | undefined) {
  const cities = getServiceCities();
  if (!name) return cities[0] ?? marketDefaultCity();
  const n = name.trim().toLowerCase();
  return (
    cities.find((c) => c.name.toLowerCase() === n || c.slug === n) ??
    cities[0] ??
    marketDefaultCity()
  );
}

export function nearestCity(lat: number, lng: number) {
  const cities = getServiceCities();
  let best = cities[0] ?? marketDefaultCity();
  let bestD = Number.POSITIVE_INFINITY;
  for (const c of cities) {
    const d = (c.lat - lat) ** 2 + (c.lng - lng) ** 2;
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

export function isInternationalMarket() {
  return getMarket().international || getMarket().cities.length === 0;
}

export function serviceAreaKm() {
  return getMarket().maxServiceKm;
}

/** Villes desservies AppO — Haute-Savoie / bassin annecien. */

export type ServiceCity = {
  id: string;
  name: string;
  slug: string;
  lat: number;
  lng: number;
  zipHint?: string;
};

export const SERVICE_CITIES: ServiceCity[] = [
  { id: "city_rumilly", name: "Rumilly", slug: "rumilly", lat: 45.8782, lng: 6.0581, zipHint: "74150" },
  { id: "city_annecy", name: "Annecy", slug: "annecy", lat: 45.8992, lng: 6.1294, zipHint: "74000" },
  { id: "city_seynod", name: "Seynod", slug: "seynod", lat: 45.8881, lng: 6.0961, zipHint: "74600" },
  { id: "city_cran", name: "Cran-Gevrier", slug: "cran-gevrier", lat: 45.909, lng: 6.1105, zipHint: "74960" },
  { id: "city_annemasse", name: "Annemasse", slug: "annemasse", lat: 46.1931, lng: 6.237, zipHint: "74100" },
  { id: "city_thonon", name: "Thonon-les-Bains", slug: "thonon", lat: 46.3705, lng: 6.4796, zipHint: "74200" },
  { id: "city_cluses", name: "Cluses", slug: "cluses", lat: 46.0614, lng: 6.5794, zipHint: "74300" },
  { id: "city_sallanches", name: "Sallanches", slug: "sallanches", lat: 45.9442, lng: 6.6316, zipHint: "74700" },
];

export const RUMILLY = {
  lat: SERVICE_CITIES[0].lat,
  lng: SERVICE_CITIES[0].lng,
  city: SERVICE_CITIES[0].name,
};

export function findCityByName(name: string | null | undefined) {
  if (!name) return SERVICE_CITIES[0];
  const n = name.trim().toLowerCase();
  return (
    SERVICE_CITIES.find((c) => c.name.toLowerCase() === n || c.slug === n) ?? SERVICE_CITIES[0]
  );
}

export function nearestCity(lat: number, lng: number) {
  let best = SERVICE_CITIES[0];
  let bestD = Number.POSITIVE_INFINITY;
  for (const c of SERVICE_CITIES) {
    const d = (c.lat - lat) ** 2 + (c.lng - lng) ** 2;
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

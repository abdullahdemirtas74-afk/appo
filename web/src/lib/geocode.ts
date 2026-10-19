import { haversineKm, nearestCity } from "./geo";

export type GeocodedAddress = {
  line: string;
  city: string;
  zip: string;
  lat: number;
  lng: number;
  label: string;
  /** Nearest AppO service city */
  serviceCityId: string;
  serviceCityName: string;
  /** Distance to nearest service city centroid (km) */
  distanceKm: number;
  inServiceArea: boolean;
};

type NominatimAddress = {
  house_number?: string;
  road?: string;
  pedestrian?: string;
  footway?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  city_district?: string;
  postcode?: string;
  county?: string;
  state?: string;
  country?: string;
};

export type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
  address?: NominatimAddress;
};

const MAX_SERVICE_KM = 45;

function streetLine(a: NominatimAddress | undefined, fallback: string): string {
  if (!a) return fallback.split(",")[0]?.trim() || fallback;
  const road = a.road || a.pedestrian || a.footway || a.neighbourhood || "";
  const num = a.house_number || "";
  if (road && num) return `${num} ${road}`.trim();
  if (road) return road;
  if (a.suburb) return a.suburb;
  return fallback.split(",")[0]?.trim() || fallback;
}

function cityName(a: NominatimAddress | undefined, fallback: string): string {
  const fromAddr =
    a?.city || a?.town || a?.village || a?.municipality || a?.city_district || a?.suburb || "";
  if (fromAddr) return fromAddr;
  // display_name often "street, postcode City, ..."
  const parts = fallback.split(",").map((p) => p.trim());
  return parts[1]?.replace(/^\d{5}\s*/, "") || parts[0] || "Rumilly";
}

export function parseNominatimResult(hit: NominatimResult): GeocodedAddress {
  const lat = Number(hit.lat);
  const lng = Number(hit.lon);
  const line = streetLine(hit.address, hit.display_name);
  const city = cityName(hit.address, hit.display_name);
  const zip = hit.address?.postcode || "";
  const nearest = nearestCity(lat, lng);
  const distanceKm = haversineKm(lat, lng, nearest.lat, nearest.lng);
  return {
    line,
    city,
    zip: zip || nearest.zipHint || "",
    lat,
    lng,
    label: hit.display_name,
    serviceCityId: nearest.id,
    serviceCityName: nearest.name,
    distanceKm: Math.round(distanceKm * 10) / 10,
    inServiceArea: distanceKm <= MAX_SERVICE_KM,
  };
}

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

const MAX_SERVICE_KM = 45;

type PhotonProps = {
  name?: string;
  street?: string;
  housenumber?: string;
  postcode?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  district?: string;
  county?: string;
  state?: string;
  country?: string;
  osm_key?: string;
  osm_value?: string;
  type?: string;
};

export type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: PhotonProps;
};

function streetLine(p: PhotonProps | undefined): string {
  if (!p) return "";
  const road = p.street || p.name || "";
  const num = p.housenumber || "";
  if (road && num) return `${num} ${road}`.trim();
  if (road) return road;
  return p.name || "";
}

function cityName(p: PhotonProps | undefined): string {
  if (!p) return "";
  return p.city || p.town || p.village || p.municipality || p.district || "";
}

export function parsePhotonFeature(feature: PhotonFeature): GeocodedAddress | null {
  const coords = feature.geometry?.coordinates;
  if (!coords || coords.length < 2) return null;
  const [lng, lat] = coords;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const p = feature.properties || {};
  const line = streetLine(p);
  const city = cityName(p);
  const zip = p.postcode || "";
  if (!line && !city) return null;
  const nearest = nearestCity(lat, lng);
  const distanceKm = haversineKm(lat, lng, nearest.lat, nearest.lng);
  const labelParts = [line, [zip, city].filter(Boolean).join(" "), p.state, p.country].filter(Boolean);
  return {
    line: line || city || nearest.name,
    city: city || nearest.name,
    zip: zip || nearest.zipHint || "",
    lat,
    lng,
    label: labelParts.join(", "),
    serviceCityId: nearest.id,
    serviceCityName: nearest.name,
    distanceKm: Math.round(distanceKm * 10) / 10,
    inServiceArea: distanceKm <= MAX_SERVICE_KM,
  };
}

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
};

export type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
  address?: NominatimAddress;
};

/** Fallback parser for Nominatim reverse. */
export function parseNominatimResult(hit: NominatimResult): GeocodedAddress {
  const lat = Number(hit.lat);
  const lng = Number(hit.lon);
  const a = hit.address;
  const road = a?.road || a?.pedestrian || a?.footway || a?.neighbourhood || "";
  const num = a?.house_number || "";
  const line = road && num ? `${num} ${road}` : road || hit.display_name.split(",")[0]?.trim() || "";
  const city =
    a?.city || a?.town || a?.village || a?.municipality || a?.city_district || a?.suburb || "";
  const zip = a?.postcode || "";
  const nearest = nearestCity(lat, lng);
  const distanceKm = haversineKm(lat, lng, nearest.lat, nearest.lng);
  return {
    line: line || nearest.name,
    city: city || nearest.name,
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

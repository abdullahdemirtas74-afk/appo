export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function etaMinutes(distanceKm: number): number {
  return Math.max(4, Math.round((distanceKm / 32) * 60));
}

export function interpolate(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  t: number,
) {
  const p = Math.min(1, Math.max(0, t));
  return {
    lat: fromLat + (toLat - fromLat) * p,
    lng: fromLng + (toLng - fromLng) * p,
  };
}

export const RUMILLY = { lat: 45.8782, lng: 6.0581, city: "Rumilly" };

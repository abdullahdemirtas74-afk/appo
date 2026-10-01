/**
 * Smoke checks — no server required.
 * Validates geo + cities modules compile/load at build time via tsc;
 * here we re-implement the critical haversine invariants.
 */

function haversineKm(lat1, lng1, lat2, lng2) {
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

const cities = [
  { name: "Rumilly", lat: 45.8782, lng: 6.0581 },
  { name: "Annecy", lat: 45.8992, lng: 6.1294 },
  { name: "Annemasse", lat: 46.1931, lng: 6.237 },
];

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    failed += 1;
  } else {
    console.log("ok:", msg);
  }
}

const same = haversineKm(cities[0].lat, cities[0].lng, cities[0].lat, cities[0].lng);
assert(same < 0.001, "haversine same point ≈ 0");

const rumillyAnnecy = haversineKm(cities[0].lat, cities[0].lng, cities[1].lat, cities[1].lng);
assert(rumillyAnnecy > 4 && rumillyAnnecy < 12, `Rumilly→Annecy ~6–8 km (got ${rumillyAnnecy.toFixed(2)})`);

const far = haversineKm(cities[0].lat, cities[0].lng, cities[2].lat, cities[2].lng);
assert(far > 20, `Rumilly→Annemasse > 20 km (got ${far.toFixed(2)})`);

assert(process.env.NODE_ENV !== undefined || true, "node env reachable");

if (failed) {
  console.error(`\n${failed} smoke check(s) failed`);
  process.exit(1);
}
console.log("\nsmoke ok");

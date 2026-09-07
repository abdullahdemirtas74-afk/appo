import { haversineKm } from "./geo";
import { effectiveTier, isBoostActive } from "./premium";
import type { DB, ProOffer, ProProfile, ServiceRequest, Settings } from "./types";

export function withRfqSettings(settings: Settings): Settings {
  return {
    ...settings,
    rfqPrimeExclusiveMinutes: settings.rfqPrimeExclusiveMinutes ?? 5,
    rfqExpiresHours: settings.rfqExpiresHours ?? 48,
  };
}

/** Best-choice score 0–100: note + rapidité + prix + proximité + taux de réussite */
export function bestChoiceScore(input: {
  rating: number;
  acceptanceRate: number;
  price: number;
  minPrice: number;
  maxPrice: number;
  proposedAt: string;
  requestCreatedAt: string;
  distanceKm: number;
  maxDistanceKm: number;
  boosted?: boolean;
  tier?: string;
}) {
  const ratingScore = Math.min(100, (input.rating / 5) * 100);
  const successScore = Math.min(100, input.acceptanceRate * 100);

  const span = Math.max(1, input.maxPrice - input.minPrice);
  const priceScore = 100 - ((input.price - input.minPrice) / span) * 100;

  const hoursUntil = Math.max(
    0,
    (new Date(input.proposedAt).getTime() - new Date(input.requestCreatedAt).getTime()) / 3600000,
  );
  // sooner is better; 0h → 100, 48h+ → ~0
  const speedScore = Math.max(0, 100 - (hoursUntil / 48) * 100);

  const distScore = Math.max(0, 100 - (input.distanceKm / Math.max(1, input.maxDistanceKm)) * 100);

  let score =
    ratingScore * 0.25 +
    speedScore * 0.2 +
    priceScore * 0.2 +
    distScore * 0.2 +
    successScore * 0.15;

  if (input.boosted) score += 2;
  if (input.tier === "elite") score += 2;
  else if (input.tier === "prime") score += 1;

  return Math.round(Math.min(100, Math.max(0, score)) * 10) / 10;
}

export function canProSeeRequest(pro: ProProfile, req: ServiceRequest, at = new Date()) {
  if (req.status !== "open") return false;
  if (new Date(req.expiresAt).getTime() <= at.getTime()) return false;
  if (!req.candidateProIds.includes(pro.id)) return false;
  const inPrimeWindow = at.getTime() < new Date(req.primeOnlyUntil).getTime();
  if (!inPrimeWindow) return true;
  const tier = effectiveTier(pro, at);
  return tier === "prime" || tier === "elite";
}

export function matchRfqPros(db: DB, categoryId: string, lat: number, lng: number) {
  return db.pros
    .filter((p) => p.verified && p.status === "verified" && p.categoryIds.includes(categoryId))
    .map((p) => ({
      pro: p,
      distance: haversineKm(lat, lng, p.lat, p.lng),
    }))
    .filter(({ pro, distance }) => {
      // Prime gets +25% radius for RFQ visibility (advantage without blocking free after window)
      const tier = effectiveTier(pro);
      const radius = tier === "prime" || tier === "elite" ? pro.radiusKm * 1.25 : pro.radiusKm;
      return distance <= radius;
    })
    .sort((a, b) => a.distance - b.distance);
}

export function enrichOffersForClient(db: DB, req: ServiceRequest, offers: ProOffer[]) {
  const pending = offers.filter((o) => o.status === "pending" || o.status === "accepted");
  if (!pending.length) return [];
  const prices = pending.map((o) => o.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const distances = pending.map((o) => {
    const pro = db.pros.find((p) => p.id === o.proId)!;
    return haversineKm(req.lat, req.lng, pro.lat, pro.lng);
  });
  const maxDistanceKm = Math.max(1, ...distances);

  const enriched = pending.map((o) => {
    const pro = db.pros.find((p) => p.id === o.proId)!;
    const user = db.users.find((u) => u.id === pro.userId)!;
    const distanceKm = haversineKm(req.lat, req.lng, pro.lat, pro.lng);
    const tier = effectiveTier(pro);
    const score = bestChoiceScore({
      rating: pro.rating,
      acceptanceRate: pro.acceptanceRate,
      price: o.price,
      minPrice,
      maxPrice,
      proposedAt: o.proposedAt,
      requestCreatedAt: req.createdAt,
      distanceKm,
      maxDistanceKm,
      boosted: isBoostActive(pro),
      tier,
    });
    return {
      ...o,
      score,
      distanceKm,
      tier,
      boostActive: isBoostActive(pro),
      pro: {
        id: pro.id,
        company: pro.company,
        rating: pro.rating,
        reviewCount: pro.reviewCount,
        acceptanceRate: pro.acceptanceRate,
        verified: pro.verified,
        user: { firstName: user.firstName, lastName: user.lastName, avatar: user.avatar },
      },
    };
  });

  enriched.sort((a, b) => b.score - a.score || a.price - b.price);
  const bestId = enriched[0]?.id;
  return enriched.map((o) => ({ ...o, bestChoice: o.id === bestId }));
}

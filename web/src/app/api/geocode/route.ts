import { NextResponse } from "next/server";
import {
  parseNominatimResult,
  parsePhotonFeature,
  type NominatimResult,
  type PhotonFeature,
} from "@/lib/geocode";
import { getMarket } from "@/lib/market";
import { pruneRateLimits, rateLimit } from "@/lib/rate-limit";

const UA = "AppO/1.0 (https://appo-ad.com; contact@appo-ad.com)";

async function photonSearch(q: string) {
  const m = getMarket();
  const { lat, lng } = m.geocodeBias;
  const lang = m.geocodeLang || "en";
  let url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&lang=${encodeURIComponent(lang)}&limit=8&lat=${lat}&lon=${lng}`;
  // Photon supports osm_tag filters but not countrycodes; bias is enough for intl
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": UA },
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GEOCODE_${res.status}:${text.slice(0, 120)}`);
  }
  const json = (await res.json()) as { features?: PhotonFeature[] };
  return json.features ?? [];
}

async function nominatimReverse(lat: number, lng: number) {
  const m = getMarket();
  const lang = m.geocodeLang || "en";
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lng))}&format=json&addressdetails=1&accept-language=${encodeURIComponent(lang)}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": UA },
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GEOCODE_${res.status}:${text.slice(0, 120)}`);
  }
  return (await res.json()) as NominatimResult & { error?: string };
}

async function photonReverse(lat: number, lng: number) {
  const m = getMarket();
  const lang = m.geocodeLang || "en";
  const url = `https://photon.komoot.io/reverse?lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lng))}&lang=${encodeURIComponent(lang)}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": UA },
    next: { revalidate: 0 },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { features?: PhotonFeature[] };
  return json.features?.[0] ?? null;
}

export async function GET(req: Request) {
  pruneRateLimits();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const rl = rateLimit(`geocode:${ip}`, 40, 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const url = new URL(req.url);
  const mode = url.searchParams.get("mode") || "search";

  try {
    if (mode === "reverse") {
      const lat = Number(url.searchParams.get("lat"));
      const lng = Number(url.searchParams.get("lng"));
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return NextResponse.json({ error: "INVALID_LOCATION" }, { status: 400 });
      }

      try {
        const raw = await nominatimReverse(lat, lng);
        if (raw && !raw.error && raw.lat) {
          return NextResponse.json({ result: parseNominatimResult(raw) });
        }
      } catch {
        /* fall through */
      }
      const feature = await photonReverse(lat, lng);
      const parsed = feature ? parsePhotonFeature(feature) : null;
      if (!parsed) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
      return NextResponse.json({ result: parsed });
    }

    const q = String(url.searchParams.get("q") || "").trim();
    if (q.length < 3) {
      return NextResponse.json({ results: [] });
    }

    const features = await photonSearch(q);
    const m = getMarket();
    const countryHints: Record<string, string[]> = {
      fr: ["france", "français"],
      ch: ["switzerland", "suisse", "schweiz", "svizzera"],
      be: ["belgium", "belgique", "belgië"],
      de: ["germany", "deutschland"],
      gb: ["united kingdom", "england", "scotland", "wales"],
      us: ["united states", "usa"],
    };
    let results = features
      .map(parsePhotonFeature)
      .filter((r): r is NonNullable<typeof r> => Boolean(r));

    if (m.geocodeCountryCodes) {
      const code = m.geocodeCountryCodes.toLowerCase();
      const hints = countryHints[code] ?? [code];
      const filtered = results.filter((r) => {
        const label = r.label.toLowerCase();
        return hints.some((h) => label.includes(h));
      });
      if (filtered.length) results = filtered;
    }

    results = results
      .sort((a, b) => Number(b.inServiceArea) - Number(a.inServiceArea) || a.distanceKm - b.distanceKm)
      .slice(0, 6);

    return NextResponse.json({ results });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "GEOCODE_FAILED" },
      { status: 502 },
    );
  }
}

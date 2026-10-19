import { NextResponse } from "next/server";
import { parseNominatimResult, type NominatimResult } from "@/lib/geocode";
import { pruneRateLimits, rateLimit } from "@/lib/rate-limit";

const UA = "AppO/1.0 (https://appo-ad.com; contact@appo-ad.com)";
const NOMINATIM = "https://nominatim.openstreetmap.org";

/** left,top,right,bottom = minLon, maxLat, maxLon, minLat */
const VIEWBOX = "5.70,46.55,7.00,45.70";

async function nominatim(path: string) {
  const res = await fetch(`${NOMINATIM}${path}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": UA,
    },
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GEOCODE_${res.status}:${text.slice(0, 120)}`);
  }
  return res.json();
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
      const raw = (await nominatim(
        `/reverse?lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lng))}&format=json&addressdetails=1&accept-language=fr`,
      )) as NominatimResult & { error?: string };
      if (!raw || raw.error || !raw.lat) {
        return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
      }
      return NextResponse.json({ result: parseNominatimResult(raw) });
    }

    const q = String(url.searchParams.get("q") || "").trim();
    if (q.length < 3) {
      return NextResponse.json({ results: [] });
    }

    const raw = (await nominatim(
      `/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&countrycodes=fr&limit=6&viewbox=${VIEWBOX}&bounded=0&accept-language=fr`,
    )) as NominatimResult[];

    const results = (Array.isArray(raw) ? raw : [])
      .map(parseNominatimResult)
      .filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lng));

    return NextResponse.json({ results });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "GEOCODE_FAILED" },
      { status: 502 },
    );
  }
}

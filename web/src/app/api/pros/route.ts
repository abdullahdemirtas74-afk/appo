import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { listPros } from "@/lib/actions";
import { findCityByName } from "@/lib/cities";

export async function GET(req: Request) {
  const session = await getSession();
  const url = new URL(req.url);
  const cityName = url.searchParams.get("city");
  const city = cityName ? findCityByName(cityName) : null;
  const latParam = url.searchParams.get("lat");
  const lngParam = url.searchParams.get("lng");
  const lat = latParam ? Number(latParam) : city?.lat;
  const lng = lngParam ? Number(lngParam) : city?.lng;
  const pros = await listPros({
    userId: session?.userId,
    categoryId: url.searchParams.get("categoryId") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
    lat: Number.isFinite(lat) ? lat : undefined,
    lng: Number.isFinite(lng) ? lng : undefined,
    available: url.searchParams.get("available") === "1",
    minRating: url.searchParams.get("minRating") ? Number(url.searchParams.get("minRating")) : undefined,
    maxPrice: url.searchParams.get("maxPrice") ? Number(url.searchParams.get("maxPrice")) : undefined,
    maxKm: url.searchParams.get("maxKm") ? Number(url.searchParams.get("maxKm")) : undefined,
    favoritesOnly: url.searchParams.get("favorites") === "1",
  });
  return NextResponse.json({ pros });
}

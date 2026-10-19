import { NextResponse } from "next/server";
import { getMarket } from "@/lib/market";
import { localeFromCountry, normalizeCountryCode, resolveAutoLocale } from "@/lib/locale-country";

/** Resolve UI language from country / market. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const country = normalizeCountryCode(url.searchParams.get("country"));
  const market = getMarket();
  const resolved = resolveAutoLocale({
    marketCountryCode: market.countryCode || null,
    marketDefaultLocale: market.defaultLocale,
    gpsCountryCode: country,
  });
  return NextResponse.json({
    ...resolved,
    marketId: market.id,
    marketCountry: market.countryCode || null,
    marketDefaultLocale: market.defaultLocale,
    fromCountry: country ? localeFromCountry(country) : null,
  });
}

"use client";

import { useEffect } from "react";
import { usePoll } from "@/lib/hooks";
import type { ServiceCity } from "@/lib/cities";

export type MarketPublic = {
  id: string;
  label: string;
  countryCode: string | null;
  regionLabel: string;
  defaultLocale: string;
  currency: string;
  currencyLocale: string;
  timeZone: string;
  vatRate: number;
  maxServiceKm: number;
  international: boolean;
  tagline: string;
  areaBlurb: string;
  governingLaw: string;
  businessId: {
    kind: string;
    label: string;
    required: boolean;
    hint: string;
  };
  cities: ServiceCity[];
  geocode: {
    bias: { lat: number; lng: number };
    lang: string;
    countryCodes: string | null;
  };
};

type MarketResponse = {
  market: MarketPublic;
};

const FALLBACK_CITY: ServiceCity = {
  id: "city_rumilly",
  name: "Rumilly",
  slug: "rumilly",
  lat: 45.8782,
  lng: 6.0581,
  zipHint: "74150",
};

/** Client market snapshot from /api/market (env-driven). */
export function useMarket() {
  const { data, loading, error, reload } = usePoll<MarketResponse>("/api/market", 0);
  const market = data?.market ?? null;
  const cities = market?.cities?.length ? market.cities : market?.international ? [] : [FALLBACK_CITY];
  const international = Boolean(market?.international) || (Boolean(market) && cities.length === 0);

  useEffect(() => {
    if (!market?.cities?.length) return;
    try {
      sessionStorage.setItem("appo_city_cache", JSON.stringify(market.cities));
    } catch {
      /* ignore */
    }
  }, [market?.id, market?.cities]);

  const defaultCity: ServiceCity =
    cities[0] ??
    ({
      id: "city_local",
      name: market?.regionLabel || "Local",
      slug: "local",
      lat: market?.geocode?.bias?.lat ?? FALLBACK_CITY.lat,
      lng: market?.geocode?.bias?.lng ?? FALLBACK_CITY.lng,
    } satisfies ServiceCity);

  function nearestFromMarket(lat: number, lng: number): ServiceCity {
    const list = cities.length > 0 ? cities : [defaultCity];
    let best = list[0];
    let bestD = Number.POSITIVE_INFINITY;
    for (const c of list) {
      const d = (c.lat - lat) ** 2 + (c.lng - lng) ** 2;
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    return best;
  }

  return {
    market,
    cities,
    international,
    defaultCity,
    loading,
    error,
    reload,
    nearestFromMarket,
    areaBlurb: market?.areaBlurb ?? "Rumilly, Annecy & alentours",
    tagline: market?.tagline ?? "Le bon pro, sans attendre",
    businessId: market?.businessId ?? {
      kind: "siret",
      label: "SIRET",
      required: true,
      hint: "14 chiffres",
    },
  };
}

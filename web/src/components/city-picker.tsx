"use client";

import { useMarket } from "@/lib/use-market";
import type { ServiceCity } from "@/lib/cities";

const STORAGE_KEY = "appo_service_city";

const FALLBACK: ServiceCity = {
  id: "city_rumilly",
  name: "Rumilly",
  slug: "rumilly",
  lat: 45.8782,
  lng: 6.0581,
  zipHint: "74150",
};

export function readSavedCity(): ServiceCity {
  if (typeof window === "undefined") return FALLBACK;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return FALLBACK;
    // Prefer id match; city list is loaded async via CityPicker / useMarket
    const cached = sessionStorage.getItem("appo_city_cache");
    if (cached) {
      const cities = JSON.parse(cached) as ServiceCity[];
      const hit = cities.find((c) => c.id === raw);
      if (hit) return hit;
    }
    return { ...FALLBACK, id: raw };
  } catch {
    return FALLBACK;
  }
}

export function saveCity(city: ServiceCity) {
  try {
    localStorage.setItem(STORAGE_KEY, city.id);
    const cached = sessionStorage.getItem("appo_city_cache");
    const cities: ServiceCity[] = cached ? JSON.parse(cached) : [];
    if (!cities.some((c) => c.id === city.id)) {
      cities.push(city);
      sessionStorage.setItem("appo_city_cache", JSON.stringify(cities.slice(-40)));
    }
  } catch {
    /* ignore */
  }
}

export function CityPicker({
  value,
  onChange,
}: {
  value: ServiceCity;
  onChange: (city: ServiceCity) => void;
}) {
  const { cities, international, defaultCity, loading } = useMarket();

  if (international || cities.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-card px-3 py-2.5 text-sm text-muted">
        Zone internationale — utilisez l’adresse GPS (pas de liste de villes).
      </div>
    );
  }

  const list = cities.length > 0 ? cities : [defaultCity];

  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wide text-muted">Ville</span>
      <select
        className="mt-1 w-full rounded-2xl border border-line bg-card px-3 py-2.5 text-sm font-semibold"
        value={list.some((c) => c.id === value.id) ? value.id : list[0]?.id}
        disabled={loading}
        onChange={(e) => {
          const city = list.find((c) => c.id === e.target.value) ?? list[0];
          if (!city) return;
          saveCity(city);
          onChange(city);
        }}
      >
        {list.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
            {c.zipHint ? ` (${c.zipHint})` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}

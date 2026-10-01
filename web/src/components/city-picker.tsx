"use client";

import { SERVICE_CITIES, type ServiceCity } from "@/lib/cities";

const STORAGE_KEY = "appo_service_city";

export function readSavedCity(): ServiceCity {
  if (typeof window === "undefined") return SERVICE_CITIES[0];
  try {
    const id = localStorage.getItem(STORAGE_KEY);
    return SERVICE_CITIES.find((c) => c.id === id) ?? SERVICE_CITIES[0];
  } catch {
    return SERVICE_CITIES[0];
  }
}

export function CityPicker({
  value,
  onChange,
}: {
  value: ServiceCity;
  onChange: (city: ServiceCity) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wide text-muted">Ville</span>
      <select
        className="mt-1 w-full rounded-2xl border border-line bg-card px-3 py-2.5 text-sm font-semibold"
        value={value.id}
        onChange={(e) => {
          const city = SERVICE_CITIES.find((c) => c.id === e.target.value) ?? SERVICE_CITIES[0];
          try {
            localStorage.setItem(STORAGE_KEY, city.id);
          } catch {
            /* ignore */
          }
          onChange(city);
        }}
      >
        {SERVICE_CITIES.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
            {c.zipHint ? ` (${c.zipHint})` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}

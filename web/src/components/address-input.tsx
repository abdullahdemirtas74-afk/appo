"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Crosshair, Loader2, MapPin, Search } from "lucide-react";
import { inputClass } from "@/components/ui";
import type { GeocodedAddress } from "@/lib/geocode";

export type AddressValue = {
  line: string;
  city: string;
  zip: string;
  lat: number;
  lng: number;
  label?: string;
};

type Props = {
  value?: AddressValue | null;
  onChange: (value: AddressValue) => void;
  required?: boolean;
  disabled?: boolean;
  /** Compact single-field look for banners */
  compact?: boolean;
  placeholder?: string;
};

export function AddressInput({
  value,
  onChange,
  required,
  disabled,
  compact,
  placeholder = "Rechercher une adresse…",
}: Props) {
  const listId = useId();
  const [query, setQuery] = useState(
    value?.line ? `${value.line}${value.zip || value.city ? `, ${value.zip} ${value.city}`.trim() : ""}` : "",
  );
  const [results, setResults] = useState<GeocodedAddress[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<AddressValue | null>(value ?? null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!value?.line) return;
    setSelected(value);
    setQuery(`${value.line}${value.zip || value.city ? `, ${value.zip} ${value.city}`.trim() : ""}`);
  }, [value?.line, value?.city, value?.zip, value?.lat, value?.lng]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function pick(hit: GeocodedAddress) {
    if (!hit.inServiceArea) {
      setError(
        `Hors zone AppO (proche de ${hit.serviceCityName}, ${hit.distanceKm} km). Choisissez une adresse dans la zone desservie.`,
      );
      return;
    }
    const next: AddressValue = {
      line: hit.line,
      city: hit.city || hit.serviceCityName,
      zip: hit.zip,
      lat: hit.lat,
      lng: hit.lng,
      label: hit.label,
    };
    setSelected(next);
    setQuery(`${next.line}, ${next.zip} ${next.city}`.trim());
    setResults([]);
    setOpen(false);
    setError("");
    onChange(next);
  }

  function search(q: string) {
    setQuery(q);
    setSelected(null);
    setError("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/geocode?mode=search&q=${encodeURIComponent(q.trim())}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Recherche impossible");
        setResults(json.results ?? []);
        setOpen(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Recherche impossible");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 320);
  }

  async function useGps() {
    setError("");
    if (!navigator.geolocation) {
      setError("GPS non disponible sur cet appareil");
      return;
    }
    setGpsLoading(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 30_000,
        });
      });
      const res = await fetch(
        `/api/geocode?mode=reverse&lat=${encodeURIComponent(String(pos.coords.latitude))}&lng=${encodeURIComponent(String(pos.coords.longitude))}`,
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Position introuvable");
      pick(json.result as GeocodedAddress);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "GPS_FAILED";
      setError(
        msg.includes("denied") || msg === "User denied Geolocation"
          ? "Autorisez la localisation dans le navigateur"
          : msg === "NOT_FOUND"
            ? "Adresse introuvable pour cette position"
            : "Impossible d’obtenir votre position",
      );
    } finally {
      setGpsLoading(false);
    }
  }

  return (
    <div ref={wrapRef} className="relative space-y-2">
      <div className={`flex gap-2 ${compact ? "" : ""}`}>
        <label className="relative block min-w-0 flex-1">
          <span className="sr-only">Adresse</span>
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            className={`${inputClass} pl-9 pr-9`}
            value={query}
            onChange={(e) => search(e.target.value)}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder={placeholder}
            required={required && !selected?.line}
            disabled={disabled}
            autoComplete="off"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
          />
          {loading ? (
            <Loader2
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted"
            />
          ) : null}
        </label>
        <button
          type="button"
          onClick={useGps}
          disabled={disabled || gpsLoading}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-2xl border border-appo/30 bg-appo/5 px-3 py-2 text-sm font-semibold text-appo hover:bg-appo/10 disabled:opacity-50"
          title="Utiliser ma position GPS"
        >
          {gpsLoading ? <Loader2 size={16} className="animate-spin" /> : <Crosshair size={16} />}
          <span className="hidden sm:inline">GPS</span>
        </button>
      </div>

      {/* Hidden fields so parent forms still see required coords via selected state */}
      <input type="hidden" name="addressLine" value={selected?.line ?? ""} readOnly />
      <input type="hidden" name="addressCity" value={selected?.city ?? ""} readOnly />
      <input type="hidden" name="addressZip" value={selected?.zip ?? ""} readOnly />
      <input type="hidden" name="addressLat" value={selected?.lat ?? ""} readOnly />
      <input type="hidden" name="addressLng" value={selected?.lng ?? ""} readOnly />

      {open && results.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-2xl border border-line bg-white py-1 shadow-lg"
        >
          {results.map((r) => (
            <li key={`${r.lat},${r.lng},${r.label}`}>
              <button
                type="button"
                role="option"
                className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm hover:bg-appo/5"
                onClick={() => pick(r)}
              >
                <MapPin size={16} className="mt-0.5 shrink-0 text-appo" />
                <span className="min-w-0">
                  <span className="block font-semibold text-ink">
                    {r.line}
                    {r.zip || r.city ? `, ${r.zip} ${r.city}`.trim() : ""}
                  </span>
                  <span className="block truncate text-xs text-muted">{r.label}</span>
                  {!r.inServiceArea ? (
                    <span className="mt-0.5 block text-xs font-medium text-amber-700">
                      Hors zone (~{r.distanceKm} km)
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {selected?.line ? (
        <p className="flex items-start gap-1.5 text-xs text-muted">
          <MapPin size={12} className="mt-0.5 shrink-0 text-appo" />
          <span>
            Position GPS : {selected.lat.toFixed(5)}, {selected.lng.toFixed(5)}
            {selected.city ? ` · ${selected.zip} ${selected.city}` : ""}
          </span>
        </p>
      ) : required ? (
        <p className="text-xs text-muted">Choisissez une suggestion ou utilisez le GPS.</p>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

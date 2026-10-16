"use client";

import { useEffect, useState } from "react";
import { MapPin, Pencil } from "lucide-react";
import { Button, inputClass } from "@/components/ui";
import { findCityByName, SERVICE_CITIES, type ServiceCity } from "@/lib/cities";
import { api } from "@/lib/hooks";
import type { Address } from "@/lib/types";
import { readSavedCity, saveCity } from "@/components/city-picker";

type Props = {
  address?: Address | null;
  onSaved?: () => void | Promise<void>;
  city?: ServiceCity | null;
  onCityChange?: (city: ServiceCity) => void;
};

export function AddressBanner({ address, onSaved, city, onCityChange }: Props) {
  const [editing, setEditing] = useState(!address?.line);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const defaultCity = city ?? readSavedCity();
  const [line, setLine] = useState(address?.line ?? "");
  const [cityId, setCityId] = useState(
    () => findCityByName(address?.city ?? defaultCity.name).id,
  );
  const [zip, setZip] = useState(address?.zip ?? defaultCity.zipHint ?? "");

  useEffect(() => {
    if (!address?.line) {
      setEditing(true);
      return;
    }
    setLine(address.line);
    const c = findCityByName(address.city);
    setCityId(c.id);
    setZip(address.zip || c.zipHint || "");
    setEditing(false);
  }, [address?.line, address?.city, address?.zip]);

  const selected = SERVICE_CITIES.find((c) => c.id === cityId) ?? SERVICE_CITIES[0];

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!line.trim()) {
      setError("Saisissez votre rue / numéro");
      return;
    }
    setSaving(true);
    setError("");
    setOk(false);
    try {
      await api("/api/me", {
        action: "addAddress",
        label: "Domicile",
        line: line.trim(),
        city: selected.name,
        zip: zip.trim() || selected.zipHint || "",
        lat: selected.lat,
        lng: selected.lng,
      });
      saveCity(selected);
      onCityChange?.(selected);
      setOk(true);
      setEditing(false);
      await onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  if (address?.line && !editing) {
    return (
      <div className="max-w-lg rounded-2xl border border-line bg-card px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2">
            <MapPin size={18} className="mt-0.5 shrink-0 text-appo" />
            <div className="min-w-0">
              <div className="text-xs font-bold uppercase tracking-wide text-muted">Adresse</div>
              <div className="truncate text-sm font-semibold text-ink">
                {address.line}, {address.zip} {address.city}
              </div>
            </div>
          </div>
          <button
            type="button"
            className="inline-flex shrink-0 items-center gap-1 rounded-xl px-2 py-1 text-xs font-semibold text-appo hover:bg-appo/5"
            onClick={() => setEditing(true)}
          >
            <Pencil size={14} />
            Modifier
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg rounded-2xl border border-appo/25 bg-gradient-to-br from-appo/5 to-card p-4">
      <div className="flex items-center gap-2">
        <MapPin size={18} className="shrink-0 text-appo" />
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-appo">Votre adresse</div>
          <p className="text-sm text-muted">Indiquez où vous êtes pour trouver les pros autour de vous.</p>
        </div>
      </div>

      <form onSubmit={save} className="mt-3 space-y-2">
        <label className="block">
          <span className="sr-only">Rue et numéro</span>
          <input
            className={inputClass}
            placeholder="Rue et numéro — ex. 12 rue de la République"
            value={line}
            onChange={(e) => setLine(e.target.value)}
            required
            autoComplete="street-address"
          />
        </label>
        <div className="grid grid-cols-[1.4fr_0.8fr] gap-2">
          <label className="block">
            <span className="sr-only">Ville</span>
            <select
              className={inputClass}
              value={cityId}
              onChange={(e) => {
                const c = SERVICE_CITIES.find((x) => x.id === e.target.value) ?? SERVICE_CITIES[0];
                setCityId(c.id);
                setZip(c.zipHint ?? "");
              }}
            >
              {SERVICE_CITIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="sr-only">Code postal</span>
            <input
              className={inputClass}
              placeholder="CP"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              inputMode="numeric"
              autoComplete="postal-code"
            />
          </label>
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {ok ? <p className="text-sm font-semibold text-green">Adresse enregistrée</p> : null}
        <div className="flex gap-2">
          {address?.line ? (
            <Button
              type="button"
              variant="secondary"
              className="flex-1 py-2.5"
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              Annuler
            </Button>
          ) : null}
          <Button type="submit" variant="now" className="flex-1 py-2.5" disabled={saving}>
            {saving ? "Enregistrement…" : address ? "Enregistrer" : "Enregistrer mon adresse"}
          </Button>
        </div>
      </form>
    </div>
  );
}

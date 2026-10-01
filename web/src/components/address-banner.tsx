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
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const defaultCity = city ?? readSavedCity();
  const [line, setLine] = useState(address?.line ?? "");
  const [cityId, setCityId] = useState(
    () => findCityByName(address?.city ?? defaultCity.name).id,
  );
  const [zip, setZip] = useState(address?.zip ?? defaultCity.zipHint ?? "");

  useEffect(() => {
    if (!address) return;
    setLine(address.line);
    const c = findCityByName(address.city);
    setCityId(c.id);
    setZip(address.zip || c.zipHint || "");
  }, [address]);

  const selected = SERVICE_CITIES.find((c) => c.id === cityId) ?? SERVICE_CITIES[0];
  const label = address
    ? `${address.line}, ${address.city}${address.zip ? ` ${address.zip}` : ""}`
    : "Indiquer mon adresse";

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!line.trim()) {
      setError("Saisissez votre rue / numéro");
      return;
    }
    setSaving(true);
    setError("");
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
      setOpen(false);
      await onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-md">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-2 rounded-2xl border border-line bg-card px-3.5 py-3 text-left transition hover:border-appo/40"
      >
        <MapPin size={18} className="mt-0.5 shrink-0 text-appo" />
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold uppercase tracking-wide text-muted">
            {address ? "Mon adresse" : "Où êtes-vous ?"}
          </div>
          <div className="mt-0.5 truncate text-sm font-semibold text-ink">{label}</div>
          {!address ? (
            <p className="mt-0.5 text-xs text-muted">Rue, ville — pour trouver les pros près de chez vous</p>
          ) : null}
        </div>
        <Pencil size={14} className="mt-1 shrink-0 text-muted" />
      </button>

      {open ? (
        <form
          onSubmit={save}
          className="mt-2 space-y-2 rounded-2xl border border-line bg-white p-3 shadow-sm"
        >
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-muted">Adresse</span>
            <input
              className={`${inputClass} mt-1`}
              placeholder="12 rue de la République"
              value={line}
              onChange={(e) => setLine(e.target.value)}
              autoFocus
              required
            />
          </label>
          <div className="grid grid-cols-[1.4fr_0.8fr] gap-2">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wide text-muted">Ville</span>
              <select
                className={`${inputClass} mt-1`}
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
              <span className="text-xs font-bold uppercase tracking-wide text-muted">CP</span>
              <input
                className={`${inputClass} mt-1`}
                placeholder="74150"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                inputMode="numeric"
              />
            </label>
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex gap-2 pt-1">
            <Button type="submit" variant="now" className="flex-1 py-2.5" disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="py-2.5"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Annuler
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

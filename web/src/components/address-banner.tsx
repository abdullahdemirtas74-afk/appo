"use client";

import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
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
  /** Affiche le formulaire seulement si pas d’adresse, ou si l’utilisateur ouvre l’édition */
  compactWhenSet?: boolean;
};

export function AddressBanner({
  address,
  onSaved,
  city,
  onCityChange,
  compactWhenSet = false,
}: Props) {
  const [editing, setEditing] = useState(!address);
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
    if (!address) {
      setEditing(true);
      return;
    }
    setLine(address.line);
    const c = findCityByName(address.city);
    setCityId(c.id);
    setZip(address.zip || c.zipHint || "");
    if (compactWhenSet) setEditing(false);
  }, [address, compactWhenSet]);

  const selected = SERVICE_CITIES.find((c) => c.id === cityId) ?? SERVICE_CITIES[0];
  const showForm = editing || !address;

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
      if (compactWhenSet) setEditing(false);
      await onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  if (!showForm && address) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="flex w-full max-w-lg items-center gap-2 rounded-2xl border border-line bg-card px-3.5 py-3 text-left transition hover:border-appo/40"
      >
        <MapPin size={18} className="shrink-0 text-appo" />
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold uppercase tracking-wide text-muted">Mon adresse</div>
          <div className="truncate text-sm font-semibold">
            {address.line}, {address.city}
            {address.zip ? ` ${address.zip}` : ""}
          </div>
        </div>
        <span className="text-xs font-semibold text-appo">Modifier</span>
      </button>
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
          <Button type="submit" variant="now" className="flex-1 py-2.5" disabled={saving}>
            {saving ? "Enregistrement…" : address ? "Mettre à jour" : "Enregistrer mon adresse"}
          </Button>
          {address && compactWhenSet ? (
            <Button type="button" variant="secondary" className="py-2.5" onClick={() => setEditing(false)}>
              Annuler
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { MapPin, Pencil } from "lucide-react";
import { AddressInput, type AddressValue } from "@/components/address-input";
import { Button } from "@/components/ui";
import { findCityByName, nearestCity, type ServiceCity } from "@/lib/cities";
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
  const [picked, setPicked] = useState<AddressValue | null>(
    address?.line
      ? {
          line: address.line,
          city: address.city,
          zip: address.zip,
          lat: address.lat,
          lng: address.lng,
        }
      : null,
  );

  useEffect(() => {
    if (!address?.line) {
      setEditing(true);
      setPicked(null);
      return;
    }
    setPicked({
      line: address.line,
      city: address.city,
      zip: address.zip,
      lat: address.lat,
      lng: address.lng,
    });
    setEditing(false);
  }, [address?.line, address?.city, address?.zip, address?.lat, address?.lng]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!picked?.line || !Number.isFinite(picked.lat) || !Number.isFinite(picked.lng)) {
      setError("Choisissez une adresse GPS (suggestion ou bouton GPS)");
      return;
    }
    setSaving(true);
    setError("");
    setOk(false);
    try {
      const serviceCity = nearestCity(picked.lat, picked.lng);
      await api("/api/me", {
        action: "addAddress",
        label: "Domicile",
        line: picked.line.trim(),
        city: picked.city || serviceCity.name,
        zip: picked.zip.trim() || serviceCity.zipHint || "",
        lat: picked.lat,
        lng: picked.lng,
      });
      saveCity(findCityByName(serviceCity.name));
      onCityChange?.(serviceCity);
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
          <p className="text-sm text-muted">
            Recherchez une vraie adresse ou utilisez le GPS ({defaultCity.name} et alentours).
          </p>
        </div>
      </div>

      <form onSubmit={save} className="mt-3 space-y-2">
        <AddressInput
          compact
          required
          value={picked}
          onChange={setPicked}
          placeholder="Rechercher une adresse ou utiliser le GPS…"
        />
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

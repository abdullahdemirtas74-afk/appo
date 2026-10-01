"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin, Navigation } from "lucide-react";
import { etaMinutes, haversineKm } from "@/lib/geo";

type Point = { lat: number; lng: number };

function osmEmbed(bbox: string, markerLat: number, markerLng: number) {
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${markerLat}%2C${markerLng}`;
}

function mapsOpenUrl(lat: number, lng: number, label?: string) {
  const q = encodeURIComponent(label || `${lat},${lng}`);
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}&q=${q}`;
}

/** Suivi live : destination + position pro (GPS ou estimation) + ETA. */
export function TrackingMap({
  destination,
  pro,
  etaMinutes: etaProp,
  label,
  unlocked = true,
  source,
}: {
  destination: Point;
  pro?: Point | null;
  etaMinutes?: number | null;
  label?: string;
  unlocked?: boolean;
  source?: "gps" | "estimate" | "destination" | "pro_base" | string | null;
}) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 2000);
    return () => clearInterval(id);
  }, []);

  const distanceKm = useMemo(() => {
    void tick;
    if (!pro || !unlocked) return null;
    return haversineKm(pro.lat, pro.lng, destination.lat, destination.lng);
  }, [destination, pro, unlocked, tick]);

  const eta = etaProp ?? (distanceKm != null ? etaMinutes(distanceKm) : null);

  const points = useMemo(() => {
    const list = [destination];
    if (pro && unlocked) list.push(pro);
    return list;
  }, [destination, pro, unlocked]);

  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const pad = Math.max(0.015, (maxLat - minLat) * 0.4, (maxLng - minLng) * 0.4);
  const bbox = `${minLng - pad}%2C${minLat - pad}%2C${maxLng + pad}%2C${maxLat + pad}`;
  const markerLat = pro && unlocked ? pro.lat : destination.lat;
  const markerLng = pro && unlocked ? pro.lng : destination.lng;
  const src = osmEmbed(bbox, markerLat, markerLng);
  const sourceLabel =
    source === "gps" ? "GPS live" : source === "estimate" ? "Position estimée" : "Suivi";

  return (
    <div className="overflow-hidden rounded-3xl border border-line">
      <div className="flex items-center justify-between gap-3 bg-ink px-4 py-2.5 text-white">
        <div className="text-sm font-semibold">
          {unlocked
            ? eta && eta > 0
              ? `En route · arrivée estimée ${eta} min`
              : label ?? "Suivi en temps réel"
            : "Carte masquée jusqu’à acceptation"}
        </div>
        {unlocked && pro ? (
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-appo opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-appo" />
          </span>
        ) : null}
      </div>
      {unlocked ? (
        <iframe title={label ?? "Suivi"} src={src} className="h-48 w-full border-0 sm:h-56 md:h-72 lg:h-80" />
      ) : (
        <div className="grid h-40 place-items-center bg-zinc-100 px-6 text-center text-sm text-muted">
          L’adresse exacte et la position du pro apparaissent dès que la mission est acceptée — pour éviter les contacts hors AppO.
        </div>
      )}
      {unlocked ? (
        <div className="space-y-2 bg-white px-4 py-3 text-xs text-muted sm:text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1.5">
              <Navigation size={14} className="text-appo" />
              <span>
                {pro ? (
                  <>
                    <span className="font-semibold text-ink">Pro</span> · {sourceLabel}
                    {distanceKm != null ? ` · ${distanceKm.toFixed(1)} km` : ""}
                  </>
                ) : (
                  <span className="font-semibold text-ink">Destination</span>
                )}
              </span>
            </div>
            <div className="flex items-center justify-end gap-1.5 text-right">
              <MapPin size={14} className="text-ink" />
              <span className="font-semibold text-ink">{label ?? "Intervention"}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              className="rounded-full border border-line px-3 py-1 font-semibold text-ink hover:bg-background"
              href={mapsOpenUrl(destination.lat, destination.lng, label)}
              target="_blank"
              rel="noreferrer"
            >
              Ouvrir le lieu
            </a>
            {pro ? (
              <a
                className="rounded-full border border-line px-3 py-1 font-semibold text-ink hover:bg-background"
                href={mapsOpenUrl(pro.lat, pro.lng, "Pro")}
                target="_blank"
                rel="noreferrer"
              >
                Position pro
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function MiniMap({
  lat,
  lng,
  label,
}: {
  lat: number;
  lng: number;
  label?: string;
}) {
  return <TrackingMap destination={{ lat, lng }} label={label} />;
}

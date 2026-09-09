"use client";

import { useEffect, useMemo, useState } from "react";

type Point = { lat: number; lng: number };

/** Suivi live : destination + position pro (GPS ou estimation) + ETA. */
export function TrackingMap({
  destination,
  pro,
  etaMinutes,
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

  const points = useMemo(() => {
    void tick;
    const list = [destination];
    if (pro && unlocked) list.push(pro);
    return list;
  }, [destination, pro, unlocked, tick]);

  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const pad = 0.02;
  const bbox = `${minLng - pad}%2C${minLat - pad}%2C${maxLng + pad}%2C${maxLat + pad}`;
  const markerLat = pro && unlocked ? pro.lat : destination.lat;
  const markerLng = pro && unlocked ? pro.lng : destination.lng;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${markerLat}%2C${markerLng}`;
  const sourceLabel =
    source === "gps" ? "GPS live" : source === "estimate" ? "Position estimée" : "Suivi";

  return (
    <div className="overflow-hidden rounded-3xl border border-line">
      <div className="flex items-center justify-between gap-3 bg-ink px-4 py-2.5 text-white">
        <div className="text-sm font-semibold">
          {unlocked
            ? etaMinutes && etaMinutes > 0
              ? `En route · arrivée estimée ${etaMinutes} min`
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
      {unlocked && pro ? (
        <div className="grid grid-cols-2 gap-2 bg-white px-4 py-2 text-xs text-muted sm:text-sm">
          <div>
            <span className="font-semibold text-ink">Pro</span> · {sourceLabel}
          </div>
          <div className="text-right">
            <span className="font-semibold text-ink">Lieu</span> · {label ?? "Intervention"}
          </div>
        </div>
      ) : unlocked && label ? (
        <div className="bg-white px-4 py-2 text-sm text-muted">{label}</div>
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

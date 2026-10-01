"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CityPicker, readSavedCity } from "@/components/city-picker";
import { Badge, Stars } from "@/components/ui";
import { findCityByName, type ServiceCity } from "@/lib/cities";
import { usePoll } from "@/lib/hooks";
import { km, money, stars } from "@/lib/format";

type Pro = {
  id: string;
  company: string;
  startingPrice: number;
  rating: number;
  reviewCount: number;
  distanceKm: number;
  availableNow: boolean;
  premiumActive?: boolean;
  boostActive?: boolean;
  tier?: string;
  verifiedComplete?: boolean;
  loyaltyBadge?: string;
  availability?: { label: string; reason: string; backAt: string | null };
  user: { firstName: string; lastName: string; avatar: string };
};

function SearchInner() {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [categoryId, setCategoryId] = useState(params.get("categoryId") ?? "");
  const [available, setAvailable] = useState(false);
  const [maxKm, setMaxKm] = useState("");
  const [minRating, setMinRating] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [city, setCity] = useState<ServiceCity | null>(null);
  useEffect(() => {
    const fromUrl = params.get("city");
    setCity(fromUrl ? findCityByName(fromUrl) : readSavedCity());
  }, [params]);
  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (categoryId) p.set("categoryId", categoryId);
    if (available) p.set("available", "1");
    if (maxKm) p.set("maxKm", maxKm);
    if (minRating) p.set("minRating", minRating);
    if (maxPrice) p.set("maxPrice", maxPrice);
    if (city) p.set("city", city.name);
    return `/api/pros?${p.toString()}`;
  }, [q, categoryId, available, maxKm, minRating, maxPrice, city]);
  const { data } = usePoll<{ pros: Pro[] }>(qs, 4000);
  const { data: cats } = usePoll<{ categories: { id: string; name: string }[] }>("/api/categories", 0);
  const when = params.get("when");

  return (
    <div className="px-5 py-6 md:px-8 md:py-8">
      <h1 className="text-2xl font-extrabold md:text-3xl">Professionnels</h1>
      {city ? (
        <div className="mt-4 max-w-sm">
          <CityPicker value={city} onChange={setCity} />
        </div>
      ) : null}
      <input
        className="mt-4 w-full rounded-2xl border border-line bg-card px-4 py-3 md:max-w-xl"
        placeholder="Rechercher un nom, une entreprise…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="mt-3 flex gap-2 overflow-x-auto pb-2 text-sm">
        <select className="rounded-full border border-line bg-card px-3 py-2" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">Catégorie</option>
          {(cats?.categories ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button className={`rounded-full border px-3 py-2 ${available ? "border-green bg-emerald-50" : "border-line bg-card"}`} onClick={() => setAvailable((v) => !v)}>
          Dispo maintenant
        </button>
        <select className="rounded-full border border-line bg-card px-3 py-2" value={maxKm} onChange={(e) => setMaxKm(e.target.value)}>
          <option value="">Distance</option>
          <option value="5">5 km</option>
          <option value="10">10 km</option>
          <option value="25">25 km</option>
        </select>
        <select className="rounded-full border border-line bg-card px-3 py-2" value={minRating} onChange={(e) => setMinRating(e.target.value)}>
          <option value="">Note</option>
          <option value="4">4+</option>
          <option value="4.5">4,5+</option>
        </select>
        <select className="rounded-full border border-line bg-card px-3 py-2" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}>
          <option value="">Prix</option>
          <option value="50">≤ 50 €</option>
          <option value="80">≤ 80 €</option>
          <option value="120">≤ 120 €</option>
        </select>
      </div>
      <div className="mt-4 grid gap-3 pb-8 sm:grid-cols-2 lg:grid-cols-3">
        {(data?.pros ?? []).map((p) => (
          <Link key={p.id} href={`/app/pros/${p.id}${when ? `?when=${encodeURIComponent(when)}` : ""}`} className="block rounded-3xl border border-line bg-card p-4 transition hover:border-appo/30 hover:shadow-sm">
            <div className="flex gap-3">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-ink font-bold text-white">
                {p.user.avatar}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold">
                  {p.user.firstName} {p.user.lastName.charAt(0)}. — {p.company}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-sm">
                  {p.verifiedComplete || p.tier ? (
                    <Badge tone="green">⭐ Vérifié</Badge>
                  ) : null}
                  {p.tier === "elite" ? (
                    <Badge tone="premium">Elite</Badge>
                  ) : p.tier === "prime" || p.premiumActive ? (
                    <Badge tone="premium">★ Prime</Badge>
                  ) : null}
                  {p.boostActive ? <Badge tone="orange">🚀 Boost</Badge> : null}
                  {p.loyaltyBadge === "gold" ? <Badge tone="premium">Gold</Badge> : null}
                  <Stars value={p.rating} />
                  <span className="font-semibold">{stars(p.rating)}</span>
                  <span className="text-muted">{p.reviewCount} avis</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                  <span>📍 {km(p.distanceKm)}</span>
                  {p.availableNow ? (
                    <Badge tone="green">🟢 Disponible maintenant</Badge>
                  ) : (
                    <Badge tone="orange">{p.availability?.label || "Indisponible"}</Badge>
                  )}
                </div>
                <div className="mt-2 text-sm font-bold">{money(p.startingPrice)}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function RecherchePage() {
  return (
    <Suspense>
      <SearchInner />
    </Suspense>
  );
}

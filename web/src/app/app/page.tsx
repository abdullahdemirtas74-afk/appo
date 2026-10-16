"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { AddressBanner } from "@/components/address-banner";
import { readSavedCity } from "@/components/city-picker";
import { Logo } from "@/components/logo";
import { NotificationBell } from "@/components/notifications";
import { Button } from "@/components/ui";
import { useMe } from "@/components/guard";
import { suggestNeeds } from "@/lib/assistant";
import { findCityByName, type ServiceCity } from "@/lib/cities";
import { money } from "@/lib/format";
import { usePoll } from "@/lib/hooks";

type Cat = { id: string; name: string; emoji: string };

export default function ClientHome() {
  const router = useRouter();
  const { data: me, reload } = useMe();
  const { data } = usePoll<{ categories: Cat[] }>("/api/categories", 0);
  const addr = me?.addresses?.find((a) => a.isDefault) ?? me?.addresses?.[0] ?? null;
  const [city, setCity] = useState<ServiceCity | null>(null);
  const [need, setNeed] = useState("");

  useEffect(() => {
    if (addr?.city) setCity(findCityByName(addr.city));
    else setCity(readSavedCity());
  }, [addr?.city]);

  const searchCity = city?.name ?? addr?.city;
  const suggestions = useMemo(() => suggestNeeds(need, 4), [need]);

  function goWithQuery(path: string, extra?: Record<string, string>) {
    const p = new URLSearchParams(extra);
    if (searchCity) p.set("city", searchCity);
    if (need.trim()) p.set("q", need.trim());
    const qs = p.toString();
    router.push(qs ? `${path}?${qs}` : path);
  }

  function submitNeed(e: React.FormEvent) {
    e.preventDefault();
    const q = need.trim();
    if (!q) {
      goWithQuery("/app/recherche");
      return;
    }
    const top = suggestions[0];
    if (top) {
      goWithQuery("/app/recherche", { categoryId: top.categoryId, q });
      return;
    }
    goWithQuery("/app/assistant", { q });
  }

  return (
    <div className="px-4 pt-5 sm:px-6 sm:pt-6 md:px-8 md:pt-8">
      <div className="flex items-center justify-between md:hidden">
        <Logo size="sm" />
        <NotificationBell />
      </div>

      <div className="mt-5 flex items-start justify-between gap-3 md:mt-0">
        <div className="min-w-0 flex-1">
          <AddressBanner
            address={addr}
            city={city}
            onCityChange={setCity}
            onSaved={() => reload()}
          />
        </div>
        <div className="hidden md:block">
          <NotificationBell />
        </div>
      </div>

      <h1 className="mt-4 text-2xl font-extrabold tracking-tight md:text-3xl lg:text-4xl">
        Quel service recherchez-vous ?
      </h1>
      <p className="mt-2 hidden max-w-xl text-muted md:block">
        Décrivez votre besoin — AppO propose le bon métier et les pros autour de vous.
      </p>

      <form onSubmit={submitNeed} className="relative mt-4 max-w-2xl md:mt-6">
        <div className="flex items-center gap-2 rounded-2xl border border-line bg-card px-3 py-2 shadow-sm focus-within:border-appo/50 focus-within:ring-2 focus-within:ring-appo/20">
          <Search size={18} className="shrink-0 text-muted" />
          <input
            className="min-w-0 flex-1 bg-transparent py-2 text-[15px] outline-none placeholder:text-muted"
            placeholder="Ex. mon évier fuit, prise HS, tonte de pelouse…"
            value={need}
            onChange={(e) => setNeed(e.target.value)}
            autoComplete="off"
            aria-label="Décrire mon besoin"
          />
          <Button type="submit" variant="now" className="shrink-0 px-4 py-2.5 text-sm">
            Chercher
          </Button>
        </div>

        {need.trim().length >= 2 ? (
          <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-line bg-white shadow-lg">
            {suggestions.length > 0 ? (
              <ul>
                {suggestions.map((s) => (
                  <li key={s.categoryId}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-appo/5"
                      onClick={() =>
                        goWithQuery("/app/recherche", {
                          categoryId: s.categoryId,
                          q: need.trim(),
                        })
                      }
                    >
                      <span>
                        <span className="font-semibold text-ink">{s.categoryName}</span>
                        {s.urgency ? (
                          <span className="ml-2 text-xs font-semibold text-appo">Urgence</span>
                        ) : null}
                      </span>
                      <span className="text-xs text-muted">dès {money(s.price)}</span>
                    </button>
                  </li>
                ))}
                <li>
                  <button
                    type="button"
                    className="w-full border-t border-line px-4 py-3 text-left text-sm font-semibold text-appo hover:bg-appo/5"
                    onClick={() => goWithQuery("/app/assistant", { q: need.trim() })}
                  >
                    Affiner avec l’assistant →
                  </button>
                </li>
              </ul>
            ) : (
              <button
                type="button"
                className="w-full px-4 py-3 text-left text-sm hover:bg-appo/5"
                onClick={() => goWithQuery("/app/assistant", { q: need.trim() })}
              >
                Pas de catégorie exacte — <span className="font-semibold text-appo">ouvrir l’assistant</span>
              </button>
            )}
          </div>
        ) : null}
      </form>

      <div className="mt-5 grid max-w-2xl grid-cols-1 gap-3 min-[420px]:grid-cols-3 md:mt-6">
        <Button href="/app/now" variant="now" className="h-24 flex-col md:h-28">
          <span className="text-lg">Maintenant</span>
          <span className="text-xs font-medium opacity-90">Urgence / immédiat</span>
        </Button>
        <Button href="/app/assistant" variant="dark" className="h-24 flex-col md:h-28">
          <span className="text-lg">Assistant</span>
          <span className="text-xs font-medium opacity-80">Décrire mon besoin</span>
        </Button>
        <Button href="/app/planifier" variant="secondary" className="h-24 flex-col md:h-28">
          <span className="text-lg">Planifier</span>
          <span className="text-xs font-medium opacity-80">Choisir un pro</span>
        </Button>
      </div>

      <div className="mt-3 grid max-w-2xl grid-cols-1 gap-3 min-[420px]:grid-cols-2">
        <Link
          href="/app/demandes/nouvelle"
          className="rounded-2xl border border-line bg-card p-4 transition hover:border-appo/40 hover:shadow-sm"
        >
          <div className="text-lg font-bold">Comparer des offres</div>
          <p className="mt-1 text-sm text-muted">Recevez plusieurs devis et choisissez.</p>
          <p className="mt-2 text-xs font-semibold text-appo">Publier une demande →</p>
        </Link>
        <Link
          href="/app/demandes/nouvelle?large=1"
          className="rounded-2xl border border-line bg-card p-4 transition hover:border-appo/40 hover:shadow-sm"
        >
          <div className="text-lg font-bold">Devis · gros travaux</div>
          <p className="mt-1 text-sm text-muted">
            Rénovation, plusieurs corps de métier — publiez un besoin et comparez les devis.
          </p>
          <p className="mt-2 text-xs font-semibold text-appo">Demander des devis →</p>
        </Link>
        <Link
          href="/app/plus"
          className="rounded-2xl border border-appo/30 bg-appo/5 p-4 transition hover:border-appo/50"
        >
          <div className="text-lg font-bold">AppO+</div>
          <p className="mt-1 text-sm text-muted">
            Négociation de prix, commissions réduites, alertes prioritaires pour les pros.
          </p>
          <p className="mt-2 text-xs font-semibold text-appo">
            {me?.clientPlusActive ? `Actif · ${me.clientPlusDaysLeft} j restants` : "Voir l’abonnement →"}
          </p>
        </Link>
        <Link
          href="/app/factures"
          className="rounded-2xl border border-ink bg-ink p-4 text-white transition hover:bg-appo"
        >
          <div className="text-lg font-bold">Devis & factures</div>
          <p className="mt-1 text-sm text-white/70">Documents électroniques de vos interventions.</p>
          <p className="mt-2 text-xs font-semibold text-appo">Ouvrir →</p>
        </Link>
        <Link
          href="/app/wallet"
          className="rounded-2xl border border-line bg-card p-4 transition hover:border-appo/40"
        >
          <div className="text-lg font-bold">Wallet & parrainage</div>
          <p className="mt-1 text-sm text-muted">Crédits, codes promo, invitations.</p>
          <p className="mt-2 text-xs font-semibold text-appo">Ouvrir le wallet →</p>
        </Link>
      </div>

      <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-muted">Catégories</h2>
      <div className="mt-3 grid grid-cols-3 gap-2 pb-8 min-[480px]:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {(data?.categories ?? []).map((c) => (
          <Link
            key={c.id}
            href={
              searchCity
                ? `/app/recherche?categoryId=${c.id}&city=${encodeURIComponent(searchCity)}`
                : `/app/recherche?categoryId=${c.id}`
            }
            className="rounded-2xl border border-line bg-card p-3 text-center transition hover:border-appo/40 hover:shadow-sm"
          >
            <div className="text-2xl">{c.emoji}</div>
            <div className="mt-1 text-[11px] font-semibold leading-tight md:text-xs">{c.name}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

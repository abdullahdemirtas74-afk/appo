"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AddressBanner } from "@/components/address-banner";
import { readSavedCity } from "@/components/city-picker";
import { Logo } from "@/components/logo";
import { NotificationBell } from "@/components/notifications";
import { Button } from "@/components/ui";
import { useMe } from "@/components/guard";
import { findCityByName, type ServiceCity } from "@/lib/cities";
import { usePoll } from "@/lib/hooks";

type Cat = { id: string; name: string; emoji: string };
type MissionLite = { id: string; status: string; category?: { name?: string }; city?: string };

export default function ClientHome() {
  const router = useRouter();
  const { data: me, reload } = useMe();
  const { data } = usePoll<{ categories: Cat[] }>("/api/categories", 0);
  const { data: missionsData } = usePoll<{ missions: MissionLite[] }>("/api/missions", 8000);
  const addr = me?.addresses?.find((a) => a.isDefault) ?? me?.addresses?.[0] ?? null;
  const [city, setCity] = useState<ServiceCity | null>(null);

  useEffect(() => {
    if (addr?.city) setCity(findCityByName(addr.city));
    else setCity(readSavedCity());
  }, [addr?.city]);

  const active = (missionsData?.missions ?? []).find((m) =>
    ["matching", "offered", "accepted", "en_route", "arrived", "in_progress"].includes(m.status),
  );

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
            compactWhenSet
          />
        </div>
        <div className="hidden md:block">
          <NotificationBell />
        </div>
      </div>

      {active ? (
        <Link
          href={`/app/missions/${active.id}`}
          className="mt-4 block max-w-2xl rounded-2xl border border-appo/30 bg-appo/5 px-4 py-3 transition hover:border-appo/50"
        >
          <div className="text-xs font-bold uppercase tracking-wide text-appo">Mission en cours</div>
          <div className="mt-0.5 font-semibold">
            {active.category?.name ?? "Intervention"}
            {active.city ? ` · ${active.city}` : ""}
          </div>
          <div className="text-sm text-muted">Suivre →</div>
        </Link>
      ) : null}

      <h1 className="mt-5 text-2xl font-extrabold tracking-tight md:text-3xl lg:text-4xl">
        Besoin d’un pro ?
      </h1>
      <p className="mt-2 max-w-xl text-muted">
        Un seul parcours : décrivez le besoin, on s’occupe du reste.
      </p>

      <Button
        variant="now"
        className="mt-5 h-16 w-full max-w-2xl text-lg"
        onClick={() => router.push("/app/demander")}
      >
        Demander un pro
      </Button>

      <div className="mt-3 flex max-w-2xl flex-wrap gap-2 text-sm">
        <Link href="/app/demander?mode=now" className="rounded-full border border-line bg-card px-3 py-1.5 font-semibold">
          Maintenant
        </Link>
        <Link href="/app/demander?mode=plan" className="rounded-full border border-line bg-card px-3 py-1.5 font-semibold">
          Rendez-vous
        </Link>
        <Link href="/app/demander?mode=devis" className="rounded-full border border-line bg-card px-3 py-1.5 font-semibold">
          Devis
        </Link>
        <Link href="/app/assistant" className="rounded-full border border-line bg-card px-3 py-1.5 font-semibold text-muted">
          Assistant
        </Link>
      </div>

      <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-muted">Services</h2>
      <div className="mt-3 grid max-w-2xl grid-cols-3 gap-2 pb-4 min-[480px]:grid-cols-4 md:grid-cols-5">
        {(data?.categories ?? []).slice(0, 8).map((c) => (
          <Link
            key={c.id}
            href={`/app/demander?categoryId=${c.id}`}
            className="rounded-2xl border border-line bg-card p-3 text-center transition hover:border-appo/40"
          >
            <div className="text-2xl">{c.emoji}</div>
            <div className="mt-1 text-[11px] font-semibold leading-tight md:text-xs">{c.name}</div>
          </Link>
        ))}
      </div>
      {(data?.categories ?? []).length > 8 ? (
        <Link href="/app/demander" className="text-sm font-semibold text-appo">
          Voir tous les services →
        </Link>
      ) : null}

      <div className="mt-8 max-w-2xl border-t border-line pt-5 pb-10">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Aussi</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <Link href="/app/missions" className="rounded-2xl border border-line px-3 py-3 font-semibold">
            Missions
          </Link>
          <Link href="/app/factures" className="rounded-2xl border border-line px-3 py-3 font-semibold">
            Factures
          </Link>
          <Link href="/app/compte" className="rounded-2xl border border-line px-3 py-3 font-semibold">
            Compte
          </Link>
          <Link href="/app/wallet" className="rounded-2xl border border-line px-3 py-3 font-semibold text-muted">
            Wallet
          </Link>
        </div>
      </div>
    </div>
  );
}

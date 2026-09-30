"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, Search } from "lucide-react";
import { Logo } from "@/components/logo";
import { NotificationBell } from "@/components/notifications";
import { Button } from "@/components/ui";
import { useMe } from "@/components/guard";
import { usePoll } from "@/lib/hooks";

type Cat = { id: string; name: string; emoji: string };

export default function ClientHome() {
  const router = useRouter();
  const { data: me } = useMe();
  const { data } = usePoll<{ categories: Cat[] }>("/api/categories", 0);
  const addr = me?.addresses?.find((a) => a.isDefault);

  return (
    <div className="px-4 pt-5 sm:px-6 sm:pt-6 md:px-8 md:pt-8">
      <div className="flex items-center justify-between md:hidden">
        <Logo size="sm" />
        <NotificationBell />
      </div>

      <div className="hidden items-start justify-between md:flex">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm text-muted">
            <MapPin size={16} className="shrink-0 text-appo" />
            <span className="truncate">{addr ? `${addr.line}, ${addr.city}` : "Rumilly"}</span>
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight lg:text-4xl">
            Quel service recherchez-vous ?
          </h1>
          <p className="mt-2 max-w-xl text-muted">
            Trouvez un pro vérifié autour de vous — immédiatement ou sur rendez-vous.
          </p>
        </div>
        <NotificationBell />
      </div>

      <div className="mt-5 flex items-center gap-2 text-sm text-muted md:hidden">
        <MapPin size={16} className="shrink-0 text-appo" />
        <span className="truncate">{addr ? `${addr.line}, ${addr.city}` : "Rumilly"}</span>
      </div>
      <h1 className="mt-2 text-2xl font-extrabold md:hidden">Quel service recherchez-vous ?</h1>

      <button
        onClick={() => router.push("/app/recherche")}
        className="mt-4 flex w-full max-w-2xl items-center gap-3 rounded-2xl border border-line bg-card px-4 py-3.5 text-left text-muted md:mt-6"
      >
        <Search size={18} className="shrink-0" />
        Plombier, électricien, ménage…
      </button>

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
            href={`/app/recherche?categoryId=${c.id}`}
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

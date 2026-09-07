"use client";

import { Crown, Sparkles, Zap } from "lucide-react";
import { useState } from "react";
import { useMe } from "@/components/guard";
import { Badge, Button } from "@/components/ui";
import { api, usePoll } from "@/lib/hooks";
import { formatDate, money } from "@/lib/format";

export default function PremiumPage() {
  const { data: me, reload: reloadMe } = useMe();
  const { data: stats, reload } = usePoll<any>("/api/pro", 5000);
  const [loading, setLoading] = useState<"monthly" | "yearly" | null>(null);
  const [msg, setMsg] = useState("");

  const active = !!(me?.pro as any)?.premiumActive || !!stats?.premiumActive;
  const until = (me?.pro as any)?.premiumUntil ?? stats?.premiumUntil;
  const days = (me?.pro as any)?.premiumDaysLeft ?? stats?.premiumDaysLeft ?? 0;
  const prices = stats?.premium ?? me?.settings;
  const monthly = prices?.premiumMonthlyPrice ?? 49;
  const yearly = prices?.premiumYearlyPrice ?? 399;
  const exclusive = prices?.premiumExclusiveSeconds ?? 45;

  async function subscribe(plan: "monthly" | "yearly") {
    setLoading(plan);
    setMsg("");
    try {
      await api("/api/pro", { action: "subscribePremium", plan });
      setMsg(plan === "yearly" ? "Premium annuel activé." : "Premium mensuel activé.");
      await reload();
      await reloadMe();
    } catch (e) {
      setMsg(e instanceof Error ? (e.message === "NOT_VERIFIED" ? "Compte non vérifié" : e.message) : "Erreur");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8">
      <div className="flex items-center gap-2">
        <Crown className="text-amber-600" size={22} />
        <h1 className="text-2xl font-extrabold md:text-3xl">AppO Premium</h1>
      </div>
      <p className="mt-2 max-w-2xl text-muted">
        Recevez les annonces AppO Now avant les autres et apparaissez en tête des recherches clients.
      </p>

      {active ? (
        <div className="mt-5 rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5">
          <Badge tone="premium">
            <Crown size={12} /> Premium actif
          </Badge>
          <div className="mt-2 text-xl font-black">Avantage prioritaire en cours</div>
          <p className="mt-1 text-sm text-muted">
            {days} jour{days > 1 ? "s" : ""} restant{days > 1 ? "s" : ""}
            {until ? ` · jusqu’au ${formatDate(until)}` : ""}
          </p>
        </div>
      ) : (
        <div className="mt-5 rounded-3xl border border-line bg-card p-5">
          <div className="font-bold">Vous êtes en formule standard</div>
          <p className="mt-1 text-sm text-muted">Passez Premium pour être contacté en premier sur AppO Now.</p>
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          {
            icon: Zap,
            title: "Annonces en avance",
            text: `Les ${exclusive} premières secondes d’une mission Now sont réservées aux Premium (s’il y en a).`,
          },
          {
            icon: Sparkles,
            title: "Mise en avant",
            text: "Votre profil apparaît en premier dans la recherche client, avec un badge Premium.",
          },
          {
            icon: Crown,
            title: "Plus de temps pour répondre",
            text: "+10 s sur le timer d’acceptation des offres Now.",
          },
        ].map((b) => (
          <div key={b.title} className="rounded-3xl border border-line bg-card p-4">
            <b.icon className="text-appo" size={20} />
            <div className="mt-2 font-bold">{b.title}</div>
            <p className="mt-1 text-sm text-muted">{b.text}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-muted">Choisir une offre</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-2 md:max-w-3xl">
        <div className="rounded-3xl border border-line bg-card p-5">
          <div className="text-sm font-semibold text-muted">Mensuel</div>
          <div className="mt-1 text-3xl font-black">{money(monthly)}</div>
          <div className="text-sm text-muted">/ 30 jours · renouvelable</div>
          <Button
            className="mt-4 w-full"
            variant="dark"
            disabled={!!loading}
            onClick={() => subscribe("monthly")}
          >
            {loading === "monthly" ? "Activation…" : active ? "Prolonger 30 jours" : "Passer Premium"}
          </Button>
        </div>
        <div className="rounded-3xl border-2 border-amber-400 bg-gradient-to-b from-amber-50 to-card p-5">
          <Badge tone="premium">Meilleure offre</Badge>
          <div className="mt-2 text-sm font-semibold text-muted">Annuel</div>
          <div className="mt-1 text-3xl font-black">{money(yearly)}</div>
          <div className="text-sm text-muted">/ 12 mois · ~{money(Math.round(yearly / 12))}/mois</div>
          <Button
            className="mt-4 w-full"
            variant="now"
            disabled={!!loading}
            onClick={() => subscribe("yearly")}
          >
            {loading === "yearly" ? "Activation…" : active ? "Prolonger 12 mois" : "Premium annuel"}
          </Button>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted">Paiement simulé V1 — aucun prélèvement réel.</p>
      {msg ? <p className="mt-2 text-sm font-semibold text-appo">{msg}</p> : null}
    </div>
  );
}

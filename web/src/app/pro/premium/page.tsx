"use client";

import { Crown, Rocket, ShieldCheck, Sparkles, Trophy, Zap } from "lucide-react";
import { useState } from "react";
import { useMe } from "@/components/guard";
import { Badge, Button } from "@/components/ui";
import { api, usePoll } from "@/lib/hooks";
import { formatDate, money } from "@/lib/format";

export default function PremiumPage() {
  const { data: me, reload: reloadMe } = useMe();
  const { data: stats, reload } = usePoll<any>("/api/pro", 4000);
  const [loading, setLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const tier = (me?.pro as any)?.tier ?? stats?.tier ?? "pro";
  const boostActive = (me?.pro as any)?.boostActive ?? stats?.boostActive;
  const boostUntil = stats?.boostUntil ?? (me?.pro as any)?.boostUntil;
  const loyalty = stats?.loyaltyBadge ?? (me?.pro as any)?.loyaltyBadge ?? "none";
  const points = stats?.loyaltyPoints ?? (me?.pro as any)?.loyaltyPoints ?? 0;
  const verified = stats?.verifiedComplete ?? (me?.pro as any)?.verifiedComplete;
  const prices = stats?.premium ?? me?.settings;
  const monthly = prices?.primeMonthlyPrice ?? prices?.premiumMonthlyPrice ?? 49;
  const yearly = prices?.primeYearlyPrice ?? prices?.premiumYearlyPrice ?? 399;
  const boost24 = prices?.boost24hPrice ?? 9;
  const boost7 = prices?.boost7dPrice ?? 29;
  const days = (me?.pro as any)?.primeDaysLeft ?? stats?.premiumDaysLeft ?? 0;
  const until = (me?.pro as any)?.primeUntil ?? (me?.pro as any)?.premiumUntil ?? stats?.premiumUntil;

  async function run(action: string, body: Record<string, unknown> = {}) {
    setLoading(action + JSON.stringify(body));
    setMsg("");
    try {
      await api("/api/pro", { action, ...body });
      setMsg("C’est enregistré.");
      await reload();
      await reloadMe();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="px-4 py-5 sm:px-6 md:px-8 md:py-8">
      <div className="flex items-center gap-2">
        <Crown className="text-amber-600" size={22} />
        <h1 className="text-2xl font-extrabold md:text-3xl">Offres Pro</h1>
      </div>
      <p className="mt-2 max-w-2xl text-muted">
        Trois niveaux : AppO Pro (gratuit), AppO Prime (abonnement) et AppO Elite (meilleurs pros).
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        <Badge tone={tier === "elite" ? "premium" : tier === "prime" ? "orange" : "neutral"}>
          Niveau : {tier === "elite" ? "Elite" : tier === "prime" ? "Prime" : "Pro"}
        </Badge>
        {verified ? (
          <Badge tone="green">
            <ShieldCheck size={12} /> Pro vérifié ⭐
          </Badge>
        ) : (
          <Badge tone="orange">Vérification en cours</Badge>
        )}
        {loyalty !== "none" ? (
          <Badge tone="premium">
            <Trophy size={12} /> Fidélité {loyalty === "elite" ? "Elite" : "Gold"}
          </Badge>
        ) : null}
        {boostActive ? <Badge tone="orange">🚀 Boost actif</Badge> : null}
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <div className="rounded-3xl border border-line bg-card p-5">
          <div className="font-bold">AppO Pro</div>
          <div className="mt-1 text-2xl font-black">Gratuit</div>
          <p className="mt-2 text-sm text-muted">Commission normale · matching standard · planning & avis.</p>
        </div>
        <div className={`rounded-3xl border-2 p-5 ${tier === "prime" || tier === "elite" ? "border-amber-400 bg-amber-50" : "border-line bg-card"}`}>
          <Badge tone="premium">Abonnement</Badge>
          <div className="mt-2 font-bold">AppO Prime</div>
          <div className="mt-1 text-2xl font-black">{money(monthly)}<span className="text-sm font-semibold">/mois</span></div>
          <p className="mt-2 text-sm text-muted">Priorité Now · outils avancés · commission réduite · +temps d’acceptation.</p>
          {tier === "prime" || tier === "elite" ? (
            <p className="mt-3 text-sm">
              Actif {days} j{until ? ` · jusqu’au ${formatDate(until)}` : ""}
            </p>
          ) : null}
          <div className="mt-4 grid gap-2">
            <Button disabled={!!loading} variant="dark" onClick={() => run("subscribePrime", { plan: "monthly" })}>
              {loading?.includes("monthly") ? "…" : "Prime 30 jours"}
            </Button>
            <Button disabled={!!loading} variant="now" onClick={() => run("subscribePrime", { plan: "yearly" })}>
              Annuel {money(yearly)}
            </Button>
          </div>
        </div>
        <div className={`rounded-3xl border-2 p-5 ${tier === "elite" ? "border-ink bg-ink text-white" : "border-line bg-card"}`}>
          <Badge tone="premium">
            <Sparkles size={12} /> Sur performance
          </Badge>
          <div className="mt-2 font-bold">AppO Elite</div>
          <div className="mt-1 text-2xl font-black">Sur invitation</div>
          <p className={`mt-2 text-sm ${tier === "elite" ? "text-white/70" : "text-muted"}`}>
            Badge Elite · priorité max · commission avantageuse · accès demandes premium / urgence en tête.
          </p>
          <p className={`mt-3 text-sm ${tier === "elite" ? "text-white/80" : "text-muted"}`}>
            Points fidélité : <b>{points}</b> · badge {loyalty === "none" ? "—" : loyalty}
          </p>
          {tier !== "elite" ? (
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between text-muted">
                <span>Missions (≥40)</span>
                <b>{Math.min(40, stats?.missions ?? me?.pro?.missionCount ?? 0)}/40</b>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-black/10">
                <div
                  className="h-full bg-amber-500"
                  style={{ width: `${Math.min(100, ((stats?.missions ?? me?.pro?.missionCount ?? 0) / 40) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-muted">
                <span>Note (≥4.7)</span>
                <b>{(stats?.rating ?? me?.pro?.rating ?? 0).toFixed(1)}</b>
              </div>
              <div className="flex justify-between text-muted">
                <span>Taux accept. (≥85%)</span>
                <b>{Math.round(((stats?.acceptanceRate ?? me?.pro?.acceptanceRate ?? 0) as number) * 100)}%</b>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-muted">Boost Pro 🚀</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-2 md:max-w-3xl">
        <div className="rounded-3xl border border-line bg-card p-5">
          <Rocket className="text-appo" size={20} />
          <div className="mt-2 font-bold">Boost 24 h</div>
          <div className="text-2xl font-black">{money(boost24)}</div>
          <p className="mt-1 text-sm text-muted">Apparaissez plus haut dans votre zone pendant 24 h.</p>
          <Button className="mt-4 w-full" variant="secondary" disabled={!!loading} onClick={() => run("buyBoost", { plan: "24h" })}>
            Activer 24 h
          </Button>
        </div>
        <div className="rounded-3xl border border-line bg-card p-5">
          <Rocket className="text-appo" size={20} />
          <div className="mt-2 font-bold">Boost 7 jours</div>
          <div className="text-2xl font-black">{money(boost7)}</div>
          <p className="mt-1 text-sm text-muted">Mise en avant une semaine entière dans votre rayon.</p>
          {boostActive && boostUntil ? (
            <p className="mt-2 text-sm text-appo">Actif jusqu’au {formatDate(boostUntil)}</p>
          ) : null}
          <Button className="mt-4 w-full" variant="dark" disabled={!!loading} onClick={() => run("buyBoost", { plan: "7d" })}>
            Activer 7 jours
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: ShieldCheck, t: "Pro vérifié ⭐", d: "SIRET/Kbis, RC Pro, identité → badge client." },
          { icon: Zap, t: "Urgence AppO ⚡", d: "Demandes < 1 h réservées aux pros dispo." },
          { icon: Trophy, t: "Fidélité 🏆", d: "Gold / Elite : visibilité + commission réduite." },
          { icon: Crown, t: "Prime / Elite", d: "Priorité d’annonces et outils avancés." },
        ].map((x) => (
          <div key={x.t} className="rounded-3xl border border-line bg-card p-4">
            <x.icon className="text-appo" size={18} />
            <div className="mt-2 font-bold">{x.t}</div>
            <p className="mt-1 text-sm text-muted">{x.d}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted">Paiements simulés V1 — aucun prélèvement réel.</p>
      {msg ? <p className="mt-2 text-sm font-semibold text-appo">{msg}</p> : null}
    </div>
  );
}

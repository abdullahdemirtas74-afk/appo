"use client";

import { useCallback, useEffect, useState } from "react";
import { usePoll, api } from "@/lib/hooks";
import { formatDate, moneyExact, stars } from "@/lib/format";
import { Badge, Button } from "@/components/ui";

type ConnectState = {
  enabled?: boolean;
  ready?: boolean;
  accountId?: string | null;
  detailsSubmitted?: boolean;
  payoutsEnabled?: boolean;
  onboardingComplete?: boolean;
};

export default function RevenusPage() {
  const { data, reload } = usePoll<any>("/api/pro", 4000);
  const [connectBusy, setConnectBusy] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connectHint, setConnectHint] = useState<string | null>(null);

  const connect: ConnectState = data?.stripeConnect ?? {};

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const flag = params.get("connect");
    if (!flag) return;
    if (flag === "return") {
      setConnectHint("Compte Stripe mis à jour. Synchronisation…");
      api<ConnectState>("/api/pro/connect", { action: "sync" })
        .then(() => reload())
        .catch(() => undefined)
        .finally(() => {
          window.history.replaceState({}, "", "/pro/revenus");
        });
    } else if (flag === "refresh") {
      setConnectHint("Reprenez l’inscription Stripe pour activer les versements.");
      window.history.replaceState({}, "", "/pro/revenus");
    }
  }, [reload]);

  const startOnboarding = useCallback(async () => {
    setConnectBusy(true);
    setConnectError(null);
    try {
      const res = await api<{ url?: string | null }>("/api/pro/connect", { action: "onboard" });
      if (res.url) {
        window.location.href = res.url;
        return;
      }
      await reload();
    } catch (e) {
      setConnectError(e instanceof Error ? e.message : "Erreur Stripe Connect");
    } finally {
      setConnectBusy(false);
    }
  }, [reload]);

  const openDashboard = useCallback(async () => {
    setConnectBusy(true);
    setConnectError(null);
    try {
      const res = await api<{ url?: string | null }>("/api/pro/connect", { action: "dashboard" });
      if (res.url) window.open(res.url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setConnectError(e instanceof Error ? e.message : "Erreur Stripe");
    } finally {
      setConnectBusy(false);
    }
  }, []);

  return (
    <div className="px-4 py-5 sm:px-6 md:px-8 md:py-8">
      <h1 className="text-2xl font-extrabold md:text-3xl">Tableau de bord 📊</h1>
      <p className="mt-1 text-sm text-muted">Vos gains, conversion, avis et panier moyen.</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge tone="premium">Niveau {data?.tier ?? "pro"}</Badge>
        {data?.boostActive ? <Badge tone="orange">Boost actif</Badge> : null}
        {data?.loyaltyBadge && data.loyaltyBadge !== "none" ? (
          <Badge tone="premium">Fidélité {data.loyaltyBadge}</Badge>
        ) : null}
        {connect.ready ? <Badge tone="premium">Stripe Connect OK</Badge> : null}
      </div>

      <div className="mt-4 rounded-3xl border border-line bg-card p-4">
        <div className="font-bold">Versements automatiques</div>
        <p className="mt-1 text-sm text-muted">
          Connectez votre compte Stripe pour recevoir automatiquement vos gains après le délai
          choisi ({data?.payoutDelayDays ?? 0} j).
        </p>
        {connectHint ? <p className="mt-2 text-sm text-appo">{connectHint}</p> : null}
        {connectError ? <p className="mt-2 text-sm text-red-600">{connectError}</p> : null}
        <div className="mt-3 flex flex-wrap gap-2">
          {connect.ready ? (
            <>
              <Button type="button" variant="secondary" disabled={connectBusy} onClick={openDashboard}>
                Espace Stripe
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={connectBusy}
                onClick={() => {
                  setConnectBusy(true);
                  api("/api/pro/connect", { action: "sync" })
                    .then(() => reload())
                    .catch((e) => setConnectError(e instanceof Error ? e.message : "Erreur"))
                    .finally(() => setConnectBusy(false));
                }}
              >
                Actualiser
              </Button>
            </>
          ) : (
            <Button type="button" disabled={connectBusy} onClick={startOnboarding}>
              {connect.accountId ? "Continuer l’inscription Stripe" : "Connecter mon compte bancaire"}
            </Button>
          )}
        </div>
        {connect.accountId && !connect.ready ? (
          <p className="mt-2 text-xs text-muted">
            Compte créé · onboarding {connect.detailsSubmitted ? "soumis" : "à terminer"} ·
            payouts {connect.payoutsEnabled ? "ON" : "OFF"}
          </p>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-center sm:grid-cols-3 lg:grid-cols-5">
        {[
          ["Aujourd’hui", moneyExact(data?.today ?? 0), true],
          ["Semaine", moneyExact(data?.week ?? 0), false],
          ["Mois", moneyExact(data?.month ?? 0), false],
          ["Panier moyen", moneyExact(data?.averageBasket ?? 0), false],
          ["Missions", String(data?.missionsCompleted ?? data?.missions ?? 0), false],
        ].map(([label, value, dark]) => (
          <div
            key={String(label)}
            className={`rounded-2xl p-3 ${dark ? "bg-ink text-white" : "border border-line bg-card"}`}
          >
            <div className={`text-[10px] ${dark ? "opacity-70" : "text-muted"}`}>{label}</div>
            <div className="font-black">{value}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-3xl border border-line bg-card p-4 text-sm">
          <div className="text-muted">Missions terminées</div>
          <div className="text-2xl font-black">{data?.missionsCompleted ?? data?.missions ?? 0}</div>
        </div>
        <div className="rounded-3xl border border-line bg-card p-4 text-sm">
          <div className="text-muted">Taux de conversion</div>
          <div className="text-2xl font-black">
            {Math.round((data?.conversionRate ?? 0) * 100)}%
          </div>
        </div>
        <div className="rounded-3xl border border-line bg-card p-4 text-sm">
          <div className="text-muted">Avis / note</div>
          <div className="text-2xl font-black">
            {data?.reviewCount ?? 0} · {stars(data?.rating ?? 0)}
          </div>
        </div>
        <div className="rounded-3xl border border-line bg-card p-4 text-sm">
          <div className="text-muted">Chez Appo</div>
          <div className="text-2xl font-black">{moneyExact(data?.held ?? 0)}</div>
        </div>
        <div className="rounded-3xl border border-line bg-card p-4 text-sm">
          <div className="text-muted">Versement à venir</div>
          <div className="text-2xl font-black">{moneyExact(data?.upcoming ?? 0)}</div>
          <div className="text-xs text-muted">Délai choisi : {data?.payoutDelayDays ?? 0} j</div>
        </div>
      </div>

      <div className="mt-4 space-y-2 rounded-3xl bg-background p-4 text-sm">
        <div className="flex justify-between">
          <span>Gains du mois</span>
          <b>{moneyExact(data?.month ?? 0)}</b>
        </div>
        <div className="flex justify-between">
          <span>Devis envoyés</span>
          <b>{data?.quotesCount ?? data?.quotes?.length ?? 0}</b>
        </div>
      </div>

      <h2 className="mt-6 font-bold">Fonds chez Appo</h2>
      <div className="mt-2 space-y-2">
        {(data?.escrow ?? []).length === 0 ? <p className="text-sm text-muted">Aucun montant en attente.</p> : null}
        {(data?.escrow ?? []).map((p: any) => (
          <div key={p.id} className="flex justify-between rounded-2xl border border-line px-4 py-3 text-sm">
            <div>
              <div className="font-semibold">{moneyExact(p.proAmount)}</div>
              <div className="text-xs text-muted">
                {p.status === "held"
                  ? "Conservé jusqu’à la fin de l’intervention"
                  : p.stripeTransferError
                    ? `En attente Stripe : ${p.stripeTransferError}`
                    : `Versement le ${formatDate(p.releaseAt || p.createdAt)}`}
              </div>
            </div>
            <div className="text-xs text-muted">{p.status === "held" ? "Séquestre" : "Programmé"}</div>
          </div>
        ))}
      </div>

      <h2 className="mt-6 font-bold">Historique paiements</h2>
      <div className="mt-2 space-y-2">
        {(data?.payments ?? []).map((p: any) => (
          <div key={p.id} className="flex justify-between rounded-2xl border border-line px-4 py-3 text-sm">
            <div>
              <div className="font-semibold">{moneyExact(p.proAmount)}</div>
              <div className="text-xs text-muted">
                {formatDate(p.paidAt || p.createdAt)} · {p.method}
                {p.stripeTransferId ? " · Stripe" : ""}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

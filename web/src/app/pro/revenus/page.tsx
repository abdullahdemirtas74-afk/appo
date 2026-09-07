"use client";

import { usePoll } from "@/lib/hooks";
import { formatDate, moneyExact, stars } from "@/lib/format";
import { Badge } from "@/components/ui";

export default function RevenusPage() {
  const { data } = usePoll<any>("/api/pro", 4000);
  return (
    <div className="px-4 py-5 sm:px-6 md:px-8 md:py-8">
      <h1 className="text-2xl font-extrabold md:text-3xl">Tableau de bord 📊</h1>
      <p className="mt-1 text-sm text-muted">CA AppO, conversion, avis, commission et panier moyen.</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge tone="premium">Niveau {data?.tier ?? "pro"}</Badge>
        {data?.boostActive ? <Badge tone="orange">Boost actif</Badge> : null}
        {data?.loyaltyBadge && data.loyaltyBadge !== "none" ? (
          <Badge tone="premium">Fidélité {data.loyaltyBadge}</Badge>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-center sm:grid-cols-3 lg:grid-cols-6">
        {[
          ["Aujourd’hui", moneyExact(data?.today ?? 0), true],
          ["Semaine", moneyExact(data?.week ?? 0), false],
          ["Mois net", moneyExact(data?.month ?? 0), false],
          ["CA brut mois", moneyExact(data?.grossMonth ?? 0), false],
          ["Commission", moneyExact(data?.feesMonth ?? data?.commissionPaidMonth ?? 0), false],
          ["Panier moyen", moneyExact(data?.averageBasket ?? 0), false],
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

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
          <div className="text-muted">À venir</div>
          <div className="text-2xl font-black">{moneyExact(data?.upcoming ?? 0)}</div>
        </div>
      </div>

      <div className="mt-4 space-y-2 rounded-3xl bg-background p-4 text-sm">
        <div className="flex justify-between">
          <span>Chiffre d’affaires (mois)</span>
          <b>{moneyExact(data?.grossMonth ?? 0)}</b>
        </div>
        <div className="flex justify-between">
          <span>Commissions AppO payées</span>
          <b>{moneyExact(data?.feesMonth ?? data?.commissionPaidMonth ?? 0)}</b>
        </div>
        <div className="flex justify-between">
          <span>Montant net</span>
          <b>{moneyExact(data?.month ?? 0)}</b>
        </div>
        <div className="flex justify-between">
          <span>Devis envoyés</span>
          <b>{data?.quotesCount ?? data?.quotes?.length ?? 0}</b>
        </div>
      </div>

      <h2 className="mt-6 font-bold">Historique paiements</h2>
      <div className="mt-2 space-y-2">
        {(data?.payments ?? []).map((p: any) => (
          <div key={p.id} className="flex justify-between rounded-2xl border border-line px-4 py-3 text-sm">
            <div>
              <div className="font-semibold">{moneyExact(p.proAmount)} net</div>
              <div className="text-xs text-muted">
                {formatDate(p.paidAt || p.createdAt)} · {p.method}
              </div>
            </div>
            <div className="text-xs text-muted">com. {moneyExact(p.commission)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

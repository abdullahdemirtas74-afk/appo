"use client";

import { usePoll } from "@/lib/hooks";
import { formatDate, moneyExact } from "@/lib/format";

export default function RevenusPage() {
  const { data } = usePoll<any>("/api/pro", 4000);
  return (
    <div className="px-5 py-6">
      <h1 className="text-2xl font-extrabold">Mes revenus</h1>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-ink p-3 text-white">
          <div className="text-[10px] opacity-70">Aujourd’hui</div>
          <div className="font-black">{moneyExact(data?.today ?? 0)}</div>
        </div>
        <div className="rounded-2xl border border-line p-3">
          <div className="text-[10px] text-muted">Semaine</div>
          <div className="font-black">{moneyExact(data?.week ?? 0)}</div>
        </div>
        <div className="rounded-2xl border border-line p-3">
          <div className="text-[10px] text-muted">Mois</div>
          <div className="font-black">{moneyExact(data?.month ?? 0)}</div>
        </div>
      </div>
      <div className="mt-4 space-y-2 rounded-3xl bg-background p-4 text-sm">
        <div className="flex justify-between"><span>Chiffre d’affaires (mois)</span><b>{moneyExact(data?.grossMonth ?? 0)}</b></div>
        <div className="flex justify-between"><span>Commissions AppO</span><b>{moneyExact(data?.feesMonth ?? 0)}</b></div>
        <div className="flex justify-between"><span>Montant net</span><b>{moneyExact(data?.month ?? 0)}</b></div>
        <div className="flex justify-between"><span>À venir</span><b>{moneyExact(data?.upcoming ?? 0)}</b></div>
      </div>
      <h2 className="mt-6 font-bold">Historique</h2>
      <div className="mt-2 space-y-2">
        {(data?.payments ?? []).map((p: any) => (
          <div key={p.id} className="flex justify-between rounded-2xl border border-line px-4 py-3 text-sm">
            <div>
              <div className="font-semibold">{moneyExact(p.proAmount)} net</div>
              <div className="text-xs text-muted">{formatDate(p.paidAt || p.createdAt)} · {p.method}</div>
            </div>
            <div className="text-xs text-muted">com. {moneyExact(p.commission)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

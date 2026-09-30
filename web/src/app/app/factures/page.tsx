"use client";

import Link from "next/link";
import { Receipt } from "lucide-react";
import { usePoll } from "@/lib/hooks";
import { moneyExact } from "@/lib/format";
import type { Invoice } from "@/lib/types";

type Item = {
  invoice: Invoice;
  mission: {
    id: string;
    description?: string;
    city?: string;
    category?: { name?: string } | null;
  } | null;
};

export default function ClientFacturesPage() {
  const { data, loading } = usePoll<{ items: Item[] }>("/api/invoices", 8000);
  const items = data?.items ?? [];

  return (
    <div className="px-5 py-6">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-ink text-white">
          <Receipt size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold">Devis & factures</h1>
          <p className="text-sm text-muted">Factures électroniques de vos interventions</p>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        {loading && !data ? <p className="text-sm text-muted">Chargement…</p> : null}
        {!loading && items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-line px-5 py-10 text-center">
            <Receipt className="mx-auto text-muted" size={28} />
            <p className="mt-3 text-sm font-semibold">Aucune facture pour l’instant</p>
            <p className="mt-1 text-xs text-muted">Elles apparaîtront après une intervention payée.</p>
          </div>
        ) : null}
        {items.map(({ invoice, mission }) => (
          <Link
            key={invoice.id}
            href={`/app/factures/${invoice.id}`}
            className="block rounded-2xl border border-line bg-card px-4 py-3 transition hover:border-ink/20"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-bold">{invoice.number}</div>
                <div className="truncate text-sm text-muted">
                  {mission?.category?.name ?? "Intervention"}
                  {mission?.description ? ` · ${mission.description}` : ""}
                </div>
                <div className="mt-1 text-xs text-muted">{mission?.city ?? ""}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-extrabold">{moneyExact(invoice.total)}</div>
                <div
                  className={`mt-1 text-xs font-bold ${
                    invoice.status === "paid" ? "text-green" : "text-muted"
                  }`}
                >
                  {invoice.status === "paid" ? "Payée" : "Émise"}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

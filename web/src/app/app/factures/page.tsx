"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { FileText, Receipt } from "lucide-react";
import { usePoll } from "@/lib/hooks";
import { moneyExact } from "@/lib/format";
import type { Invoice, Quote } from "@/lib/types";

type MissionBrief = {
  id: string;
  description?: string;
  city?: string;
  category?: { name?: string } | null;
} | null;

type Payload = {
  items: { invoice: Invoice; mission: MissionBrief }[];
  quotes: { quote: Quote; mission: MissionBrief }[];
};

const QUOTE_STATUS: Record<Quote["status"], string> = {
  draft: "Brouillon",
  sent: "À signer",
  signed: "Signé",
  rejected: "Refusé",
};

function DocumentsHub({ role }: { role: "client" | "pro" }) {
  const base = role === "client" ? "/app" : "/pro";
  const { data, loading } = usePoll<Payload>("/api/invoices", 8000);
  const [tab, setTab] = useState<"factures" | "devis">("factures");
  const invoices = data?.items ?? [];
  const quotes = data?.quotes ?? [];

  return (
    <div className="px-5 py-6">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-ink text-white">
          <Receipt size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold">Devis & factures</h1>
          <p className="text-sm text-muted">Tous vos documents au même endroit</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-card p-1 border border-line">
        <button
          type="button"
          onClick={() => setTab("factures")}
          className={`rounded-xl py-2.5 text-sm font-bold ${
            tab === "factures" ? "bg-ink text-white" : "text-muted"
          }`}
        >
          Factures ({invoices.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("devis")}
          className={`rounded-xl py-2.5 text-sm font-bold ${
            tab === "devis" ? "bg-ink text-white" : "text-muted"
          }`}
        >
          Devis ({quotes.length})
        </button>
      </div>

      <div className="mt-5 space-y-2">
        {loading && !data ? <p className="text-sm text-muted">Chargement…</p> : null}

        {tab === "factures" ? (
          <>
            {!loading && invoices.length === 0 ? (
              <Empty
                icon={<Receipt className="mx-auto text-muted" size={28} />}
                title="Aucune facture"
                hint="Elles apparaissent après une intervention payée."
              />
            ) : null}
            {invoices.map(({ invoice, mission }) => (
              <Link
                key={invoice.id}
                href={`${base}/factures/${invoice.id}`}
                className="block rounded-2xl border border-line bg-card px-4 py-3 transition hover:border-ink/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-bold">{invoice.number}</div>
                    <div className="truncate text-sm text-muted">
                      {mission?.category?.name ?? "Intervention"}
                      {mission?.description ? ` · ${mission.description}` : ""}
                    </div>
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
          </>
        ) : (
          <>
            {!loading && quotes.length === 0 ? (
              <Empty
                icon={<FileText className="mx-auto text-muted" size={28} />}
                title="Aucun devis"
                hint={
                  role === "pro"
                    ? "Envoie un devis depuis une mission."
                    : "Les devis reçus s’affichent ici."
                }
              />
            ) : null}
            {quotes.map(({ quote, mission }) => (
              <Link
                key={quote.id}
                href={`${base}/missions/${quote.missionId}`}
                className="block rounded-2xl border border-line bg-card px-4 py-3 transition hover:border-ink/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-bold">
                      Devis · {mission?.category?.name ?? "Mission"}
                    </div>
                    <div className="truncate text-sm text-muted">
                      {quote.lines.map((l) => l.label).join(" · ") || mission?.description || "—"}
                    </div>
                    <div className="mt-1 text-xs text-muted">{mission?.city ?? ""}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-extrabold">{moneyExact(quote.total)}</div>
                    <div
                      className={`mt-1 text-xs font-bold ${
                        quote.status === "signed"
                          ? "text-green"
                          : quote.status === "sent"
                            ? "text-appo"
                            : "text-muted"
                      }`}
                    >
                      {QUOTE_STATUS[quote.status]}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function Empty({
  icon,
  title,
  hint,
}: {
  icon: ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-line px-5 py-10 text-center">
      {icon}
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </div>
  );
}

export default function ClientFacturesPage() {
  return <DocumentsHub role="client" />;
}

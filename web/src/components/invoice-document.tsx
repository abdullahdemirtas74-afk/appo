"use client";

import type { Invoice, InvoiceParty } from "@/lib/types";
import { moneyExact } from "@/lib/format";

function PartyBlock({ title, party }: { title: string; party?: InvoiceParty | null }) {
  if (!party) return null;
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">{title}</div>
      <div className="mt-1 text-sm font-bold text-ink">{party.name}</div>
      {party.siret ? <div className="text-xs text-muted">SIRET {party.siret}</div> : null}
      {party.address ? <div className="text-xs text-muted">{party.address}</div> : null}
      {(party.zip || party.city) && (
        <div className="text-xs text-muted">
          {[party.zip, party.city].filter(Boolean).join(" ")}
        </div>
      )}
      {party.email ? <div className="text-xs text-muted">{party.email}</div> : null}
      {party.phone ? <div className="text-xs text-muted">{party.phone}</div> : null}
    </div>
  );
}

function paymentLabel(method?: string | null) {
  if (!method) return "—";
  const map: Record<string, string> = {
    card: "Carte bancaire",
    apple_pay: "Apple Pay",
    google_pay: "Google Pay",
  };
  return map[method] ?? method;
}

export function InvoiceDocument({
  invoice,
  categoryName,
}: {
  invoice: Invoice;
  categoryName?: string;
}) {
  const vatRate = invoice.vatRate ?? 0.2;
  const lines = invoice.lines?.length
    ? invoice.lines
    : [
        {
          label: categoryName ? `Intervention ${categoryName}` : "Prestation",
          quantity: 1,
          unitPriceHt: invoice.amountHt ?? invoice.total,
          vatRate,
        },
      ];
  const amountHt =
    invoice.amountHt ??
    Math.round(lines.reduce((s, l) => s + l.quantity * l.unitPriceHt, 0) * 100) / 100;
  const amountVat = invoice.amountVat ?? Math.round((invoice.total - amountHt) * 100) / 100;
  const issued = new Date(invoice.createdAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const service = invoice.serviceAt
    ? new Date(invoice.serviceAt).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <article className="invoice-doc overflow-hidden rounded-3xl border border-line bg-white shadow-sm">
      <header className="relative border-b border-line bg-[linear-gradient(135deg,#fffdf9_0%,#f7f1e8_55%,#ffe8de_100%)] px-6 py-7 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-extrabold uppercase tracking-[0.22em] text-appo">AppO</div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-ink sm:text-3xl">
              Facture électronique
            </h1>
            <p className="mt-1 text-sm text-muted">Document dématérialisé — format AppO e-facture</p>
          </div>
          <div className="rounded-2xl bg-ink px-4 py-3 text-right text-white">
            <div className="text-[10px] font-semibold uppercase tracking-wide opacity-70">N°</div>
            <div className="font-mono text-lg font-bold">{invoice.number}</div>
            <div
              className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                invoice.status === "paid" ? "bg-green/20 text-[#86efac]" : "bg-white/15 text-white"
              }`}
            >
              {invoice.status === "paid" ? "Payée" : "Émise"}
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-6 px-6 py-6 sm:grid-cols-2 sm:px-8">
        <PartyBlock title="Émetteur" party={invoice.seller} />
        <PartyBlock title="Client" party={invoice.buyer} />
      </div>

      <div className="mx-6 grid gap-3 rounded-2xl border border-line bg-background/70 px-4 py-3 text-sm sm:mx-8 sm:grid-cols-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-muted">Date d’émission</div>
          <div className="font-semibold">{issued}</div>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-muted">Prestation</div>
          <div className="font-semibold">{service ?? "—"}</div>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-muted">Règlement</div>
          <div className="font-semibold">{paymentLabel(invoice.paymentMethod)}</div>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto px-6 sm:px-8">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[10px] font-bold uppercase tracking-wide text-muted">
              <th className="pb-2 pr-3 font-bold">Désignation</th>
              <th className="pb-2 pr-3 font-bold">Qté</th>
              <th className="pb-2 pr-3 font-bold">P.U. HT</th>
              <th className="pb-2 pr-3 font-bold">TVA</th>
              <th className="pb-2 text-right font-bold">Total HT</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, i) => {
              const ht = Math.round(line.quantity * line.unitPriceHt * 100) / 100;
              return (
                <tr key={`${line.label}-${i}`} className="border-b border-line/70 align-top">
                  <td className="py-3 pr-3 font-medium text-ink">{line.label}</td>
                  <td className="py-3 pr-3 text-muted">{line.quantity}</td>
                  <td className="py-3 pr-3">{moneyExact(line.unitPriceHt)}</td>
                  <td className="py-3 pr-3 text-muted">{Math.round(line.vatRate * 100)} %</td>
                  <td className="py-3 text-right font-semibold">{moneyExact(ht)}</td>
                </tr>
              );
            })}
            {invoice.tip > 0 ? (
              <tr className="border-b border-line/70">
                <td className="py-3 pr-3 font-medium">Pourboire (hors TVA)</td>
                <td className="py-3 pr-3 text-muted">1</td>
                <td className="py-3 pr-3">{moneyExact(invoice.tip)}</td>
                <td className="py-3 pr-3 text-muted">0 %</td>
                <td className="py-3 text-right font-semibold">{moneyExact(invoice.tip)}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-end px-6 sm:px-8">
        <div className="w-full max-w-xs space-y-1.5 rounded-2xl border border-line bg-card p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Total HT</span>
            <span className="font-semibold">{moneyExact(amountHt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">TVA ({Math.round(vatRate * 100)} %)</span>
            <span className="font-semibold">{moneyExact(amountVat)}</span>
          </div>
          {invoice.tip > 0 ? (
            <div className="flex justify-between">
              <span className="text-muted">Pourboire</span>
              <span className="font-semibold">{moneyExact(invoice.tip)}</span>
            </div>
          ) : null}
          <div className="flex justify-between border-t border-line pt-2 text-base">
            <span className="font-bold">Total TTC</span>
            <span className="font-black text-appo">{moneyExact(invoice.total + (invoice.tip || 0))}</span>
          </div>
        </div>
      </div>

      {invoice.note ? (
        <p className="mt-6 border-t border-line px-6 py-4 text-xs leading-relaxed text-muted sm:px-8">
          {invoice.note}
        </p>
      ) : null}

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-background/50 px-6 py-3 text-[11px] text-muted sm:px-8">
        <span>AppO SAS · plateforme de mise en relation · facture électronique</span>
        <span className="font-mono">{invoice.id}</span>
      </footer>
    </article>
  );
}

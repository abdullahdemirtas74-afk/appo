"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { InvoiceDocument } from "@/components/invoice-document";
import { Button } from "@/components/ui";
import { usePoll } from "@/lib/hooks";
import type { Invoice } from "@/lib/types";

type InvoicePayload = {
  invoice: Invoice;
  mission: {
    id: string;
    category?: { name?: string } | null;
  };
};

export default function ProInvoicePage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading } = usePoll<InvoicePayload>(id ? `/api/invoices/${id}` : null, 0);

  if (loading && !data) {
    return <div className="px-5 py-10 text-sm text-muted">Chargement de la facture…</div>;
  }
  if (!data?.invoice) {
    return (
      <div className="px-5 py-10">
        <p className="text-sm text-muted">Facture introuvable.</p>
        <Link href="/pro/factures" className="mt-3 inline-block text-sm font-semibold text-appo">
          ← Retour aux factures
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/pro/factures" className="text-sm font-semibold text-appo">
          ← Factures
        </Link>
        <Button variant="secondary" onClick={() => window.print()}>
          Imprimer / PDF
        </Button>
      </div>
      <InvoiceDocument invoice={data.invoice} categoryName={data.mission.category?.name} />
    </div>
  );
}

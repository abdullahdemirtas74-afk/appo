"use client";

import { api, usePoll } from "@/lib/hooks";
import { Button } from "@/components/ui";
import { formatDate, moneyExact } from "@/lib/format";

export default function AdminPaiements() {
  const { data, reload } = usePoll<any>("/api/admin", 4000);
  return (
    <div>
      <h1 className="text-3xl font-extrabold">Paiements</h1>
      <p className="text-sm text-muted">
        Séquestre simulé : prélevé à l’acceptation, conservé par Appo jusqu’à la fin, puis versé selon le délai du pro (0–30 j). Stripe à brancher plus tard.
      </p>
      <div className="mt-4 space-y-2">
        {(data?.payments ?? []).map((p: any) => (
          <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line bg-white px-4 py-3 text-sm">
            <div>
              <b>{moneyExact(p.amount)}</b> client · com. {moneyExact(p.commission)} · pro {moneyExact(p.proAmount)}
              <div className="text-xs text-muted">
                {p.method} · {p.status === "held" ? "séquestre" : p.status === "scheduled" ? `versement ${p.releaseAt ? formatDate(p.releaseAt) : "programmé"}` : p.status} · {formatDate(p.createdAt)}
              </div>
            </div>
            {p.status === "paid" || p.status === "held" || p.status === "scheduled" ? (
              <Button variant="secondary" onClick={async () => { await api("/api/admin", { action: "refund", paymentId: p.id }); reload(); }}>
                Rembourser
              </Button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

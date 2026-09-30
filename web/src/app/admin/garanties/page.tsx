"use client";

import { Button } from "@/components/ui";
import { api, usePoll } from "@/lib/hooks";
import { formatDate, money } from "@/lib/format";

export default function AdminGarantiesPage() {
  const { data, reload } = usePoll<any>("/api/growth", 4000);
  const claims = (data?.guarantees ?? []).filter((g: any) => g.claimStatus === "open" || g.claimStatus === "approved" || g.claimStatus === "rejected");

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Garanties</h1>
      <p className="text-sm text-muted">Claims clients — approbation crédite le Wallet.</p>
      <div className="mt-4 space-y-2">
        {claims.length === 0 ? <p className="text-sm text-muted">Aucun claim.</p> : null}
        {claims.map((g: any) => (
          <div key={g.id} className="rounded-2xl border border-line bg-white p-4 text-sm">
            <div className="font-bold">
              {money(g.coverageAmount)} · {g.claimStatus} · {g.status}
            </div>
            <div className="text-muted">{g.claimReason} · {formatDate(g.createdAt)}</div>
            {g.claimStatus === "open" ? (
              <div className="mt-2 flex gap-2">
                <Button
                  variant="now"
                  onClick={async () => {
                    await api("/api/growth", { action: "adminResolveGuarantee", id: g.id, approve: true });
                    reload();
                  }}
                >
                  Approuver
                </Button>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    await api("/api/growth", { action: "adminResolveGuarantee", id: g.id, approve: false });
                    reload();
                  }}
                >
                  Refuser
                </Button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { Button } from "@/components/ui";
import { api, usePoll } from "@/lib/hooks";
import { formatDate, money } from "@/lib/format";

export default function GarantiePage() {
  const { data, reload } = usePoll<any>("/api/growth", 4000);
  const rate = Math.round((data?.settings?.guaranteeRate ?? 0.05) * 100);

  return (
    <div className="px-5 py-6 pb-10">
      <h1 className="text-2xl font-extrabold">Garantie AppO</h1>
      <p className="mt-1 text-sm text-muted">
        Couverture optionnelle ({rate}% du prix) pendant {data?.settings?.guaranteeDays ?? 30} jours après l’intervention.
      </p>
      <div className="mt-4 rounded-3xl border border-line bg-card p-4 text-sm">
        <p>Conditions démo :</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
          <li>Souscription possible dès que la mission est confirmée</li>
          <li>Claim ouvert depuis la mission ou ici</li>
          <li>Validation admin → crédit Wallet</li>
        </ul>
      </div>
      <h2 className="mt-6 font-bold">Mes garanties</h2>
      <div className="mt-2 space-y-2">
        {(data?.guarantees ?? []).length === 0 ? <p className="text-sm text-muted">Aucune garantie active.</p> : null}
        {(data?.guarantees ?? []).map((g: any) => (
          <div key={g.id} className="rounded-2xl border border-line p-4 text-sm">
            <div className="font-bold">
              Couverture {money(g.coverageAmount)} · prime {money(g.premium)}
            </div>
            <div className="text-muted">
              {g.status} · expire {formatDate(g.expiresAt)}
              {g.claimStatus !== "none" ? ` · claim ${g.claimStatus}` : ""}
            </div>
            {g.status === "active" && g.claimStatus === "none" ? (
              <Button
                className="mt-2"
                variant="secondary"
                onClick={async () => {
                  const reason = prompt("Motif du claim") || "Problème après intervention";
                  await api("/api/growth", { action: "claimGuarantee", id: g.id, reason });
                  reload();
                }}
              >
                Ouvrir un claim
              </Button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

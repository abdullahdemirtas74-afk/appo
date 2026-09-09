"use client";

import { api, usePoll } from "@/lib/hooks";
import { Badge, Button } from "@/components/ui";

const DOC_LABEL: Record<string, string> = {
  identite: "Identité",
  entreprise: "Kbis",
  assurance: "RC Pro",
  certification: "Certification",
};

export default function AdminPros() {
  const { data, reload } = usePoll<any>("/api/admin", 3000);
  const pros = data?.pros ?? [];
  return (
    <div>
      <h1 className="text-3xl font-extrabold">Professionnels</h1>
      <p className="mt-1 text-sm text-muted">Validez chaque document, puis activez le badge Pro vérifié.</p>
      <div className="mt-4 space-y-3">
        {pros.map((p: any) => (
          <div key={p.id} className="rounded-3xl border border-line bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="font-bold">
                  {p.user.firstName} {p.user.lastName} — {p.company}
                </div>
                <div className="text-sm text-muted">
                  SIRET {p.siret} · {p.city} · {p.user.email}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge tone={p.status === "verified" ? "green" : p.status === "pending" ? "orange" : "red"}>
                    {p.status}
                  </Badge>
                  {p.verifiedComplete ? <Badge tone="green">Dossier OK</Badge> : <Badge tone="orange">Docs incomplets</Badge>}
                  {p.online ? <Badge tone="green">En ligne</Badge> : <Badge>Hors ligne</Badge>}
                  {p.tier === "elite" ? <Badge tone="premium">Elite</Badge> : null}
                  {p.premiumActive || p.tier === "prime" ? <Badge tone="premium">Prime</Badge> : null}
                  {p.boostActive ? <Badge tone="orange">Boost</Badge> : null}
                </div>
                <div className="mt-3 space-y-2">
                  {(p.checklist ?? p.documents?.map((d: any) => ({ type: d.type, status: d.status, doc: d, label: DOC_LABEL[d.type] ?? d.type, required: d.type !== "certification" })) ?? []).map(
                    (row: any) => (
                      <div key={row.type} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-background px-3 py-2 text-sm">
                        <div>
                          <span className="font-semibold">{row.label ?? DOC_LABEL[row.type] ?? row.type}</span>
                          <span className="text-muted"> · {row.doc?.name ?? "—"} · {row.status}</span>
                          {row.doc?.rejectReason ? <span className="text-red-600"> — {row.doc.rejectReason}</span> : null}
                        </div>
                        {row.doc && row.status === "pending" ? (
                          <div className="flex gap-1">
                            <Button
                              variant="secondary"
                              onClick={async () => {
                                await api("/api/admin", {
                                  action: "reviewDocument",
                                  proId: p.id,
                                  documentId: row.doc.id,
                                  decision: "approved",
                                });
                                reload();
                              }}
                            >
                              OK
                            </Button>
                            <Button
                              variant="danger"
                              onClick={async () => {
                                const reason = prompt("Motif du refus") || "Document non conforme";
                                await api("/api/admin", {
                                  action: "reviewDocument",
                                  proId: p.id,
                                  documentId: row.doc.id,
                                  decision: "rejected",
                                  reason,
                                });
                                reload();
                              }}
                            >
                              Refus
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    ),
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {p.status !== "verified" ? (
                  <>
                    <Button
                      onClick={async () => {
                        try {
                          await api("/api/admin", { action: "verifyPro", proId: p.id, decision: "verified" });
                        } catch (e) {
                          if (e instanceof Error && e.message === "DOCS_INCOMPLETE") {
                            const ok = confirm("Documents incomplets. Forcer la validation ?");
                            if (!ok) return;
                            await api("/api/admin", { action: "verifyPro", proId: p.id, decision: "verified", force: true });
                          } else {
                            alert(e instanceof Error ? e.message : "Erreur");
                            return;
                          }
                        }
                        reload();
                      }}
                    >
                      Valider compte
                    </Button>
                    <Button
                      variant="danger"
                      onClick={async () => {
                        const reason = prompt("Motif") || "Dossier incomplet";
                        await api("/api/admin", { action: "verifyPro", proId: p.id, decision: "rejected", reason });
                        reload();
                      }}
                    >
                      Refuser
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      await api("/api/admin", { action: "verifyPro", proId: p.id, decision: "suspended" });
                      reload();
                    }}
                  >
                    Suspendre
                  </Button>
                )}
                <Button
                  variant="secondary"
                  onClick={async () => {
                    await api("/api/admin", { action: "grantPrime", proId: p.id, days: 30 });
                    reload();
                  }}
                >
                  +30j Prime
                </Button>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    await api("/api/admin", { action: "grantBoost", proId: p.id, hours: 24 });
                    reload();
                  }}
                >
                  Boost 24h
                </Button>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    await api("/api/admin", {
                      action: "setElite",
                      proId: p.id,
                      elite: p.tier !== "elite",
                    });
                    reload();
                  }}
                >
                  {p.tier === "elite" ? "Retirer Elite" : "Passer Elite"}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

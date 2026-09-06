"use client";

import { api, usePoll } from "@/lib/hooks";
import { Badge, Button } from "@/components/ui";

export default function AdminPros() {
  const { data, reload } = usePoll<any>("/api/admin", 3000);
  const pros = data?.pros ?? [];
  return (
    <div>
      <h1 className="text-3xl font-extrabold">Professionnels</h1>
      <div className="mt-4 space-y-3">
        {pros.map((p: any) => (
          <div key={p.id} className="rounded-3xl border border-line bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-bold">
                  {p.user.firstName} {p.user.lastName} — {p.company}
                </div>
                <div className="text-sm text-muted">SIRET {p.siret} · {p.city} · {p.user.email}</div>
                <div className="mt-2 flex gap-2">
                  <Badge tone={p.status === "verified" ? "green" : p.status === "pending" ? "orange" : "red"}>{p.status}</Badge>
                  {p.online ? <Badge tone="green">En ligne</Badge> : <Badge>Hors ligne</Badge>}
                </div>
                <div className="mt-2 text-xs text-muted">
                  Docs : {p.documents.map((d: any) => `${d.type} (${d.status})`).join(" · ")}
                </div>
              </div>
              <div className="flex gap-2">
                {p.status === "pending" ? (
                  <>
                    <Button onClick={async () => { await api("/api/admin", { action: "verifyPro", proId: p.id, decision: "verified" }); reload(); }}>Valider</Button>
                    <Button variant="danger" onClick={async () => { await api("/api/admin", { action: "verifyPro", proId: p.id, decision: "rejected" }); reload(); }}>Refuser</Button>
                  </>
                ) : (
                  <Button variant="secondary" onClick={async () => { await api("/api/admin", { action: "verifyPro", proId: p.id, decision: "suspended" }); reload(); }}>Suspendre</Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

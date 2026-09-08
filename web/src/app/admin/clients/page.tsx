"use client";

import { useState } from "react";
import { api, usePoll } from "@/lib/hooks";
import { Badge, Button } from "@/components/ui";

function plusActive(u: any) {
  return u.clientPlusUntil && new Date(u.clientPlusUntil).getTime() > Date.now();
}

export default function AdminClients() {
  const { data, reload } = usePoll<any>("/api/admin", 5000);
  const clients = (data?.users ?? []).filter((u: any) => u.role === "client" && !u.deletedAt);
  const [revealed, setRevealed] = useState<Record<string, any>>({});

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Clients</h1>
      <p className="mt-1 text-sm text-muted">
        Données personnelles masquées par défaut. Le dévoilement est journalisé (audit).
      </p>
      <div className="mt-4 space-y-3">
        {clients.map((u: any) => {
          const full = revealed[u.id];
          const email = full?.email ?? u.email;
          const phone = full?.phone ?? u.phone;
          const lastName = full?.lastName ?? u.lastName;
          return (
            <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-line bg-white p-4">
              <div>
                <div className="font-bold">
                  {u.firstName} {lastName}
                </div>
                <div className="text-sm text-muted">
                  {email} · {phone}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {u.clientKind && u.clientKind !== "particulier" ? (
                    <Badge>{u.clientKind === "entreprise" ? "Entreprise" : "Syndicat"}</Badge>
                  ) : (
                    <Badge>Particulier</Badge>
                  )}
                  {plusActive(u) ? <Badge tone="premium">AppO+</Badge> : null}
                  {u.organizationName ? <Badge>{u.organizationName}</Badge> : null}
                  {full ? <Badge tone="red">PII révélées</Badge> : null}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {u.suspended ? <Badge tone="red">Suspendu</Badge> : <Badge tone="green">Actif</Badge>}
                {!full ? (
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      const res = await api<{ result: { user: any } }>("/api/admin", {
                        action: "revealClientPii",
                        userId: u.id,
                      });
                      setRevealed((prev) => ({ ...prev, [u.id]: res.result.user }));
                    }}
                  >
                    Révéler
                  </Button>
                ) : (
                  <Button variant="secondary" onClick={() => setRevealed((prev) => {
                    const next = { ...prev };
                    delete next[u.id];
                    return next;
                  })}>
                    Masquer
                  </Button>
                )}
                <Button
                  variant="secondary"
                  onClick={async () => {
                    await api("/api/admin", { action: "suspendUser", userId: u.id, suspended: !u.suspended });
                    reload();
                  }}
                >
                  {u.suspended ? "Réactiver" : "Suspendre"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

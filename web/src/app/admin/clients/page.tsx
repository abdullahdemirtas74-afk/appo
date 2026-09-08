"use client";

import { api, usePoll } from "@/lib/hooks";
import { Badge, Button } from "@/components/ui";

function plusActive(u: any) {
  return u.clientPlusUntil && new Date(u.clientPlusUntil).getTime() > Date.now();
}

export default function AdminClients() {
  const { data, reload } = usePoll<any>("/api/admin", 5000);
  const clients = (data?.users ?? []).filter((u: any) => u.role === "client");
  return (
    <div>
      <h1 className="text-3xl font-extrabold">Clients</h1>
      <div className="mt-4 space-y-3">
        {clients.map((u: any) => (
          <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-line bg-white p-4">
            <div>
              <div className="font-bold">
                {u.firstName} {u.lastName}
              </div>
              <div className="text-sm text-muted">
                {u.email} · {u.phone}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {u.clientKind && u.clientKind !== "particulier" ? (
                  <Badge>{u.clientKind === "entreprise" ? "Entreprise" : "Syndicat"}</Badge>
                ) : (
                  <Badge>Particulier</Badge>
                )}
                {plusActive(u) ? <Badge tone="premium">AppO+</Badge> : null}
                {u.organizationName ? <Badge>{u.organizationName}</Badge> : null}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {u.suspended ? <Badge tone="red">Suspendu</Badge> : <Badge tone="green">Actif</Badge>}
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
        ))}
      </div>
    </div>
  );
}

"use client";

import { api, usePoll } from "@/lib/hooks";
import { Badge, Button } from "@/components/ui";

export default function AdminLitiges() {
  const { data, reload } = usePoll<any>("/api/admin", 4000);
  return (
    <div>
      <h1 className="text-3xl font-extrabold">Litiges</h1>
      <div className="mt-4 space-y-3">
        {(data?.disputes ?? []).map((d: any) => (
          <div key={d.id} className="rounded-3xl border border-line bg-white p-4">
            <div className="flex justify-between">
              <b>{d.missionId}</b>
              <Badge tone={d.status === "open" ? "orange" : "green"}>{d.status}</Badge>
            </div>
            <p className="mt-2 text-sm">{d.reason}</p>
            {d.status === "open" ? (
              <Button className="mt-3" onClick={async () => { await api("/api/admin", { action: "resolveDispute", id: d.id }); reload(); }}>
                Résoudre
              </Button>
            ) : null}
          </div>
        ))}
        {!data?.disputes?.length ? <p className="text-muted">Aucun litige.</p> : null}
      </div>
    </div>
  );
}

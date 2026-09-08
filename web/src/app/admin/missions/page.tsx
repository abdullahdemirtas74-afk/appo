"use client";

import { api, usePoll } from "@/lib/hooks";
import { Badge, Button } from "@/components/ui";
import { STATUS_LABELS, formatDate, money } from "@/lib/format";

export default function AdminMissions() {
  const { data, reload } = usePoll<any>("/api/admin", 3000);
  return (
    <div>
      <h1 className="text-3xl font-extrabold">Missions</h1>
      <div className="mt-4 overflow-x-auto rounded-3xl border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-background text-xs uppercase text-muted">
            <tr>
              <th className="p-3">Service</th>
              <th>Client</th>
              <th>Pro</th>
              <th>Statut</th>
              <th>Montant</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(data?.missions ?? []).slice(0, 40).map((m: any) => (
              <tr key={m.id} className="border-t border-line">
                <td className="p-3">
                  {m.category?.name}
                  {m.isLargeWorks ? <span className="ml-1 text-xs text-appo">· gros travaux</span> : null}
                </td>
                <td>{m.client?.firstName}</td>
                <td>{m.pro?.user?.firstName ?? "—"}</td>
                <td>
                  <Badge>{STATUS_LABELS[m.status]}</Badge>
                </td>
                <td>{money(m.total)}</td>
                <td>{formatDate(m.createdAt)}</td>
                <td className="p-2">
                  {!["completed", "cancelled"].includes(m.status) ? (
                    <Button
                      variant="secondary"
                      className="!px-3 !py-1.5 text-xs"
                      onClick={async () => {
                        if (!confirm("Annuler cette mission ?")) return;
                        await api("/api/admin", { action: "cancelMission", missionId: m.id });
                        reload();
                      }}
                    >
                      Annuler
                    </Button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

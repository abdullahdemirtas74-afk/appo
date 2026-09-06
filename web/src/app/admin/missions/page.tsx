"use client";

import { usePoll } from "@/lib/hooks";
import { Badge } from "@/components/ui";
import { STATUS_LABELS, formatDate, money } from "@/lib/format";

export default function AdminMissions() {
  const { data } = usePoll<any>("/api/admin", 3000);
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
            </tr>
          </thead>
          <tbody>
            {(data?.missions ?? []).slice(0, 40).map((m: any) => (
              <tr key={m.id} className="border-t border-line">
                <td className="p-3">{m.category?.name}</td>
                <td>{m.client?.firstName}</td>
                <td>{m.pro?.user?.firstName ?? "—"}</td>
                <td><Badge>{STATUS_LABELS[m.status]}</Badge></td>
                <td>{money(m.total)}</td>
                <td>{formatDate(m.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

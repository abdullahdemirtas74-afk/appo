"use client";

import Link from "next/link";
import { DocumentsEntry } from "@/components/documents-entry";
import { usePoll } from "@/lib/hooks";
import { STATUS_LABELS, formatDate, money } from "@/lib/format";
import { Badge } from "@/components/ui";

export default function MissionsPage() {
  const { data } = usePoll<{ missions: any[] }>("/api/missions", 3000);
  const list = data?.missions ?? [];
  return (
    <div className="px-5 py-6">
      <h1 className="text-2xl font-extrabold">Mes réservations</h1>
      <DocumentsEntry href="/app/factures" />
      <div className="mt-4 space-y-3">
        {list.map((m) => (
          <Link key={m.id} href={`/app/missions/${m.id}`} className="block rounded-3xl border border-line p-4">
            <div className="flex items-center justify-between">
              <b>{m.category?.name}</b>
              <Badge tone={m.status === "completed" ? "green" : m.status === "cancelled" ? "red" : "orange"}>
                {STATUS_LABELS[m.status]}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted">{m.description}</p>
            <div className="mt-2 flex justify-between text-sm">
              <span>{formatDate(m.createdAt)}</span>
              <span className="font-bold">{money(m.total)}</span>
            </div>
          </Link>
        ))}
        {!list.length ? <p className="text-sm text-muted">Aucune mission pour le moment.</p> : null}
      </div>
    </div>
  );
}

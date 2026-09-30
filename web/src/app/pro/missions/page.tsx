"use client";

import Link from "next/link";
import { DocumentsEntry } from "@/components/documents-entry";
import { usePoll } from "@/lib/hooks";
import { Badge } from "@/components/ui";
import { STATUS_LABELS, formatDate, money } from "@/lib/format";

export default function ProMissions() {
  const { data } = usePoll<{ missions: any[] }>("/api/missions", 2000);
  return (
    <div className="px-5 py-6">
      <h1 className="text-2xl font-extrabold">Missions</h1>
      <DocumentsEntry href="/pro/factures" />
      <div className="mt-4 space-y-3">
        {(data?.missions ?? []).map((m) => (
          <Link key={m.id} href={`/pro/missions/${m.id}`} className="block rounded-3xl border border-line p-4">
            <div className="flex justify-between">
              <b>{m.category?.name}</b>
              <Badge>{STATUS_LABELS[m.status]}</Badge>
            </div>
            <p className="text-sm text-muted">{m.description}</p>
            <div className="mt-1 text-sm">
              📍 {m.city} · {money(m.total)} · {formatDate(m.createdAt)}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

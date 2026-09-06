"use client";

import { useMe } from "@/components/guard";
import { DAY_LABELS, formatDate, STATUS_LABELS } from "@/lib/format";
import { usePoll } from "@/lib/hooks";
import { api } from "@/lib/hooks";

export default function PlanningPage() {
  const { data: me, reload } = useMe();
  const { data } = usePoll<{ missions: any[] }>("/api/missions", 5000);
  const schedule = me?.pro?.schedule ?? [];
  const future = (data?.missions ?? []).filter((m) =>
    ["accepted", "offered", "en_route"].includes(m.status) || m.type === "scheduled",
  );

  return (
    <div className="px-5 py-6">
      <h1 className="text-2xl font-extrabold">Planning</h1>
      <div className="mt-4 divide-y divide-line rounded-3xl border border-line">
        {schedule.map((s) => (
          <div key={s.day} className="flex items-center justify-between px-4 py-3">
            <div>
              <div className="font-semibold">{DAY_LABELS[s.day]}</div>
              <div className="text-sm text-muted">{s.available ? `${s.start}–${s.end}` : "indisponible"}</div>
            </div>
            <button
              className="text-sm font-semibold text-appo"
              onClick={async () => {
                const next = schedule.map((d) => (d.day === s.day ? { ...d, available: !d.available } : d));
                await api("/api/pro", { schedule: next });
                reload();
              }}
            >
              {s.available ? "Désactiver" : "Activer"}
            </button>
          </div>
        ))}
      </div>
      <h2 className="mt-8 font-bold">Réservations à venir</h2>
      <div className="mt-3 space-y-2">
        {future.map((m) => (
          <a key={m.id} href={`/pro/missions/${m.id}`} className="block rounded-2xl border border-line p-3 text-sm">
            <b>{m.category?.name}</b> · {STATUS_LABELS[m.status]}
            <div className="text-muted">{formatDate(m.scheduledAt || m.createdAt)}</div>
          </a>
        ))}
      </div>
    </div>
  );
}

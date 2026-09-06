"use client";

import { api, usePoll } from "@/lib/hooks";
import { moneyExact } from "@/lib/format";
import { Button } from "@/components/ui";

export default function AdminHome() {
  const { data, reload } = usePoll<any>("/api/admin", 4000);
  const cards = [
    ["Utilisateurs", data?.userCount],
    ["Pros actifs", data?.activePros],
    ["En validation", data?.pendingPros],
    ["Missions live", data?.liveMissions],
    ["Volume d’affaires", moneyExact(data?.volume ?? 0)],
    ["CA AppO", moneyExact(data?.revenue ?? 0)],
    ["Panier moyen", moneyExact(data?.averageBasket ?? 0)],
    ["Taux d’annulation", `${Math.round((data?.cancelRate ?? 0) * 100)} %`],
  ];
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold">Administration</h1>
          <p className="text-sm text-muted">Pilotage de la plateforme AppO — V1 locale</p>
        </div>
        <Button
          variant="secondary"
          onClick={async () => {
            if (!confirm("Réinitialiser les données de démo ?")) return;
            await api("/api/admin", { action: "reset" });
            reload();
          }}
        >
          Reset démo
        </Button>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([k, v]) => (
          <div key={String(k)} className="rounded-3xl border border-line bg-white p-4">
            <div className="text-xs text-muted">{k}</div>
            <div className="text-2xl font-black">{v ?? "—"}</div>
          </div>
        ))}
      </div>
      <div className="mt-8 rounded-3xl border border-line bg-white p-5">
        <h2 className="font-bold">Commission & matching</h2>
        <p className="text-sm text-muted">
          Commission actuelle : {Math.round((data?.settings?.commissionRate ?? 0.15) * 100)} % · Compte à rebours AppO Now : {data?.settings?.offerSeconds}s
        </p>
        <div className="mt-3 flex gap-2">
          <Button
            variant="secondary"
            onClick={async () => {
              await api("/api/admin", { action: "settings", commissionRate: 0.12 });
              reload();
            }}
          >
            Commission 12 %
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              await api("/api/admin", { action: "settings", commissionRate: 0.15 });
              reload();
            }}
          >
            Commission 15 %
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              await api("/api/admin", { action: "settings", offerSeconds: 20 });
              reload();
            }}
          >
            Timer 20s
          </Button>
        </div>
      </div>
    </div>
  );
}

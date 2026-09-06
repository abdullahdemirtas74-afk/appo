"use client";

import { BadgeCheck } from "lucide-react";
import { useMe } from "@/components/guard";
import { Badge, Button } from "@/components/ui";
import { api, usePoll } from "@/lib/hooks";
import { money, stars } from "@/lib/format";

export default function ProHome() {
  const { data: me, reload: reloadMe } = useMe();
  const { data, reload } = usePoll<any>("/api/pro", 3000);
  const pro = me?.pro;
  const pending = pro && pro.status !== "verified";

  async function toggle() {
    await api("/api/pro", { online: !pro?.online });
    reload();
    reloadMe();
  }

  return (
    <div className="px-5 py-6">
      <div className="text-sm text-muted">AppO Pro</div>
      <h1 className="text-2xl font-extrabold">Bonjour {me?.user?.firstName} 👋</h1>
      {pending ? (
        <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-4">
          <div className="font-bold">Compte en cours de vérification</div>
          <p className="mt-1 text-sm">Un administrateur valide vos documents. Vous recevrez le badge Pro vérifié ensuite.</p>
        </div>
      ) : (
        <>
          <button onClick={toggle} className={`mt-4 w-full rounded-3xl p-5 text-left text-white ${pro?.online ? "bg-green" : "bg-zinc-700"}`}>
            <div className="text-xs uppercase tracking-wide opacity-80">{pro?.online ? "En ligne" : "Hors ligne"}</div>
            <div className="text-2xl font-black">{pro?.online ? "🟢 DISPONIBLE" : "⚫ HORS LIGNE"}</div>
            <div className="text-sm opacity-90">Recevez des missions AppO Now près de chez vous.</div>
          </button>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-3xl bg-ink p-4 text-white">
              <div className="text-xs opacity-70">Aujourd’hui</div>
              <div className="text-2xl font-black">{money(data?.today ?? 0)}</div>
            </div>
            <div className="rounded-3xl border border-line p-4">
              <div className="text-xs text-muted">Ce mois</div>
              <div className="text-2xl font-black">{money(data?.month ?? 0)}</div>
            </div>
          </div>
          <div className="mt-3 flex gap-3 text-sm">
            <Badge>{data?.missions ?? 0} missions</Badge>
            <Badge tone="green">⭐ {stars(data?.rating ?? 0)}</Badge>
            {pro?.verified ? (
              <Badge tone="green">
                <BadgeCheck size={12} /> Pro vérifié
              </Badge>
            ) : null}
          </div>
          <div className="mt-6">
            <div className="text-sm font-bold">Rayon d’intervention</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {[5, 10, 25, 50].map((n) => (
                <button
                  key={n}
                  className={`rounded-full px-3 py-2 text-sm font-semibold ${pro?.radiusKm === n ? "bg-ink text-white" : "bg-background"}`}
                  onClick={async () => {
                    await api("/api/pro", { radiusKm: n });
                    reloadMe();
                  }}
                >
                  {n} km
                </button>
              ))}
            </div>
          </div>
          <Button href="/pro/missions" className="mt-8 w-full" variant="secondary">
            Voir les missions
          </Button>
        </>
      )}
    </div>
  );
}

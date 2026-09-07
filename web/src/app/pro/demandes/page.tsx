"use client";

import Link from "next/link";
import { Badge } from "@/components/ui";
import { usePoll } from "@/lib/hooks";
import { formatDate } from "@/lib/format";
import { useMe } from "@/components/guard";

export default function ProDemandesList() {
  const { data: me } = useMe();
  const { data } = usePoll<{ requests: any[] }>("/api/requests", 3000);
  const { data: stats } = usePoll<any>("/api/pro", 8000);
  const tier = (me?.pro as any)?.tier ?? stats?.tier ?? "pro";

  return (
    <div className="px-4 py-5 sm:px-6 md:px-8 md:py-8">
      <h1 className="text-2xl font-extrabold">Demandes clients</h1>
      <p className="mt-1 text-sm text-muted">
        Envoyez une offre (prix, délai, durée, matériel).{" "}
        {tier === "prime" || tier === "elite"
          ? "Accès prioritaire Prime/Elite actif."
          : "Les demandes arrivent d’abord aux Prime — vous pouvez répondre ensuite."}
      </p>

      {(tier === "prime" || tier === "elite") && stats?.offerStats ? (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-2xl border border-line p-3 text-sm">
            <div className="text-muted">Offres envoyées</div>
            <b>{stats.offerStats.total}</b>
          </div>
          <div className="rounded-2xl border border-line p-3 text-sm">
            <div className="text-muted">Gagnées</div>
            <b>{stats.offerStats.accepted}</b>
          </div>
          <div className="rounded-2xl border border-line p-3 text-sm">
            <div className="text-muted">Taux de succès</div>
            <b>{Math.round((stats.offerStats.winRate ?? 0) * 100)}%</b>
          </div>
          <div className="rounded-2xl border border-line p-3 text-sm">
            <div className="text-muted">Prix moyen</div>
            <b>{Math.round(stats.offerStats.avgPrice ?? 0)} €</b>
          </div>
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        {(data?.requests ?? []).length === 0 ? (
          <p className="text-sm text-muted">Aucune demande visible pour le moment.</p>
        ) : (
          (data?.requests ?? []).map((r) => (
            <Link
              key={r.id}
              href={`/pro/demandes/${r.id}`}
              className="block rounded-3xl border border-line bg-card p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-bold">{r.category?.name}</div>
                <div className="flex gap-2">
                  {r.primeWindowOpen ? <Badge tone="premium">Priorité</Badge> : null}
                  {r.myOffer ? <Badge tone="green">Offre envoyée</Badge> : <Badge>Nouvelle</Badge>}
                </div>
              </div>
              <p className="mt-1 line-clamp-2 text-sm">{r.description}</p>
              <div className="mt-2 text-xs text-muted">
                📍 {r.city} · {r.availabilityNote} · {formatDate(r.createdAt)}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

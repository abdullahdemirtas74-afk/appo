"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Badge, Button } from "@/components/ui";
import { api, usePoll } from "@/lib/hooks";
import { formatDate, km, money, stars } from "@/lib/format";

export default function ClientDemandePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, reload } = usePoll<{ request: any }>(id ? `/api/requests/${id}` : null, 3000);
  const r = data?.request;
  if (!r) return <div className="p-6 text-muted">Chargement…</div>;

  return (
    <div className="px-4 py-5 sm:px-6 md:px-8 md:py-8">
      <div className="text-xs font-bold uppercase tracking-wide text-appo">
        {r.isLargeWorks ? "Devis · gros travaux" : "Appel d’offres"}
      </div>
      <h1 className="mt-1 text-2xl font-extrabold">{r.category?.name}</h1>
      <p className="mt-2 text-sm leading-relaxed">{r.description}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted">
        <span>📍 {r.city}</span>
        <span>· {r.availabilityNote}</span>
        <Badge
          tone={
            r.status === "open" ? "green" : r.status === "awarded" ? "premium" : r.status === "cancelled" ? "red" : "neutral"
          }
        >
          {r.status === "open"
            ? "Ouverte"
            : r.status === "awarded"
              ? "Attribuée"
              : r.status === "cancelled"
                ? "Annulée"
                : r.status === "expired"
                  ? "Expirée"
                  : r.status}
        </Badge>
        {r.primeWindowOpen ? (
          <Badge tone="premium">
            Accès Prime · {Math.max(1, Math.ceil((new Date(r.primeOnlyUntil).getTime() - Date.now()) / 60000))} min
          </Badge>
        ) : r.status === "open" ? (
          <Badge>Ouverte à tous les pros</Badge>
        ) : null}
      </div>
      {r.photos?.[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={r.photos[0]} alt="" className="mt-4 h-36 w-full max-w-md rounded-2xl object-cover" />
      ) : null}

      <h2 className="mt-8 text-lg font-bold">
        Propositions ({r.offerCount ?? r.offers?.length ?? 0})
      </h2>
      <p className="text-sm text-muted">Classées par « Meilleur choix » (note + rapidité + prix + proximité + réussite).</p>

      <div className="mt-4 space-y-3">
        {(r.offers ?? []).length === 0 ? (
          <div className="rounded-3xl border border-dashed border-line p-6 text-sm text-muted">
            En attente d’offres des professionnels…
          </div>
        ) : (
          (r.offers ?? []).map((o: any) => (
            <div
              key={o.id}
              className={`rounded-3xl border p-4 ${
                o.bestChoice ? "border-appo bg-orange-50/50" : "border-line bg-card"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    {o.bestChoice ? <Badge tone="premium">Meilleur choix</Badge> : null}
                    <span className="font-bold">
                      ⭐ {o.pro?.user?.firstName} — {stars(o.pro?.rating ?? 0)}/5
                    </span>
                    {o.tier === "prime" || o.tier === "elite" ? (
                      <Badge tone="premium">{o.tier === "elite" ? "Elite" : "Prime"}</Badge>
                    ) : null}
                  </div>
                  <div className="mt-1 text-sm text-muted">{o.pro?.company}</div>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm">
                    <b>{money(o.price)}</b>
                    <span>{formatDate(o.proposedAt)}</span>
                    <span>~{o.durationMinutes} min</span>
                    <span>📍 {km(o.distanceKm)}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted">
                    Matériel :{" "}
                    {o.materialsIncluded === "yes"
                      ? "compris"
                      : o.materialsIncluded === "partial"
                        ? "partiel"
                        : "non compris"}
                    {o.materialsNote ? ` · ${o.materialsNote}` : ""}
                  </div>
                  {o.message ? <p className="mt-2 text-sm">{o.message}</p> : null}
                  <div className="mt-1 text-xs text-muted">Score AppO : {o.score}/100</div>
                </div>
                {r.status === "open" && o.status === "pending" ? (
                  <Button
                    variant="now"
                    onClick={async () => {
                      const res = await api<{ mission: { id: string } }>(`/api/requests/${r.id}`, {
                        action: "selectOffer",
                        offerId: o.id,
                      });
                      router.push(`/app/missions/${res.mission.id}`);
                    }}
                  >
                    Choisir
                  </Button>
                ) : o.status === "accepted" ? (
                  <Badge tone="green">Retenue</Badge>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>

      {r.status === "open" ? (
        <Button
          className="mt-6"
          variant="secondary"
          onClick={async () => {
            await api(`/api/requests/${r.id}`, { action: "cancel" });
            reload();
          }}
        >
          Annuler la demande
        </Button>
      ) : null}
      {r.missionId ? (
        <Button className="mt-4" href={`/app/missions/${r.missionId}`}>
          Voir la mission
        </Button>
      ) : null}
      <div className="mt-4">
        <Link href="/app/demandes" className="text-sm font-semibold text-appo">
          ← Mes demandes
        </Link>
      </div>
    </div>
  );
}

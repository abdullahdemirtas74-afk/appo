"use client";

import { BadgeCheck } from "lucide-react";
import { useMe } from "@/components/guard";
import { Badge, Button } from "@/components/ui";
import { api, usePoll } from "@/lib/hooks";
import { formatDate, money, stars } from "@/lib/format";

export default function ProHome() {
  const { data: me, reload: reloadMe } = useMe();
  const { data, reload } = usePoll<any>("/api/pro", 3000);
  const pro = me?.pro as any;
  const pending = pro && pro.status !== "verified";
  const availability = pro?.availability ?? data?.availability;
  const onAbsence = availability?.reason === "absence";

  async function toggle() {
    try {
      await api("/api/pro", { online: !pro?.online });
      reload();
      reloadMe();
    } catch (e) {
      alert(
        e instanceof Error && e.message === "ON_ABSENCE"
          ? "Impossible : vous êtes en congé / absence. Modifiez votre planning d’abord."
          : "Action impossible",
      );
    }
  }

  return (
    <div className="px-5 py-6 md:px-8 md:py-8">
      <div className="text-sm text-muted md:hidden">AppO Pro</div>
      <h1 className="text-2xl font-extrabold md:text-3xl">Bonjour {me?.user?.firstName}</h1>
      {pending ? (
        <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-4">
          <div className="font-bold">Compte en cours de vérification</div>
          <p className="mt-1 text-sm">
            Un administrateur valide vos documents. Vous recevrez le badge Pro vérifié ensuite.
          </p>
        </div>
      ) : (
        <>
          {onAbsence ? (
            <div className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 p-4">
              <div className="font-bold">{availability?.label}</div>
              <p className="mt-1 text-sm">
                Aucune alerte AppO Now pendant cette période.
                {availability?.backAt ? ` Reprise : ${formatDate(availability.backAt)}.` : ""}
              </p>
              <Button href="/pro/planning" className="mt-3" variant="secondary">
                Gérer mes absences
              </Button>
            </div>
          ) : null}
          <button
            onClick={toggle}
            disabled={onAbsence}
            className={`mt-4 w-full rounded-3xl p-5 text-left text-white disabled:opacity-60 md:max-w-xl ${
              availability?.availableNow ? "bg-green" : "bg-zinc-700"
            }`}
          >
            <div className="text-xs uppercase tracking-wide opacity-80">
              {availability?.availableNow ? "En ligne" : availability?.label || "Hors ligne"}
            </div>
            <div className="text-2xl font-black">
              {availability?.availableNow ? "🟢 DISPONIBLE" : "⚫ INDISPONIBLE"}
            </div>
            <div className="text-sm opacity-90">
              {availability?.availableNow
                ? "Recevez des missions AppO Now près de chez vous."
                : "Activez la dispo seulement si vous pouvez accepter maintenant."}
            </div>
          </button>
          <div className="mt-4 grid grid-cols-2 gap-3 md:max-w-xl">
            <div className="rounded-3xl bg-ink p-4 text-white">
              <div className="text-xs opacity-70">Aujourd’hui</div>
              <div className="text-2xl font-black">{money(data?.today ?? 0)}</div>
            </div>
            <div className="rounded-3xl border border-line p-4">
              <div className="text-xs text-muted">Ce mois</div>
              <div className="text-2xl font-black">{money(data?.month ?? 0)}</div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <Badge>{data?.missions ?? 0} missions</Badge>
            <Badge tone="green">⭐ {stars(data?.rating ?? 0)}</Badge>
            {pro?.verified ? (
              <Badge tone="green">
                <BadgeCheck size={12} /> Pro vérifié
              </Badge>
            ) : null}
            {(pro as any)?.tier === "elite" ? <Badge tone="premium">Elite</Badge> : null}
            {(pro as any)?.tier === "prime" || (pro as any)?.premiumActive ? <Badge tone="premium">Prime</Badge> : null}
            {(pro as any)?.boostActive ? <Badge tone="orange">Boost</Badge> : null}
          </div>
          {(pro as any)?.tier === "elite" || (pro as any)?.premiumActive || (pro as any)?.boostActive ? (
            <div className="mt-4 rounded-3xl border border-appo/30 bg-appo/5 p-4 md:max-w-xl">
              <div className="font-bold">Priorité matching active</div>
              <p className="mt-1 text-sm text-muted">
                {(pro as any)?.tier === "elite"
                  ? "Elite : vous voyez les missions Now et RFQ en premier."
                  : (pro as any)?.premiumActive
                    ? "Prime : fenêtre exclusive + meilleur score de matching."
                    : "Boost : mise en avant temporaire dans le matching."}
                {(pro as any)?.boostActive ? " Boost en cours." : ""}
              </p>
              <Button href="/pro/premium" className="mt-3" variant="secondary">
                Voir Offres
              </Button>
            </div>
          ) : (
            <div className="mt-4 rounded-3xl border border-line p-4 md:max-w-xl">
              <div className="font-bold">Passez devant les autres pros</div>
              <p className="mt-1 text-sm text-muted">Prime et Boost améliorent votre place dans AppO Now et les demandes.</p>
              <Button href="/pro/premium" className="mt-3" variant="now">
                Découvrir Prime
              </Button>
            </div>
          )}
          <div className="mt-6">
            <div className="text-sm font-bold">Rayon d’intervention</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {[5, 10, 25, 50].map((n) => (
                <button
                  key={n}
                  className={`rounded-full px-3 py-2 text-sm font-semibold ${
                    pro?.radiusKm === n ? "bg-ink text-white" : "bg-background"
                  }`}
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
          <Button href="/pro/planning" className="mt-6 w-full" variant="secondary">
            Planning & congés
          </Button>
          <Button href="/pro/premium" className="mt-3 w-full" variant={(pro as any)?.tier === "pro" ? "now" : "secondary"}>
            {(pro as any)?.tier === "elite"
              ? "Espace Elite"
              : (pro as any)?.tier === "prime" || (pro as any)?.premiumActive
                ? "Gérer Prime / Boost"
                : "Passer AppO Prime"}
          </Button>
          <Button href="/pro/business" className="mt-3 w-full" variant="secondary">
            AppO Business
          </Button>
          <Button href="/pro/missions" className="mt-3 w-full" variant="secondary">
            Voir les missions
          </Button>
        </>
      )}
    </div>
  );
}

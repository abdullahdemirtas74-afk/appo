"use client";

import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { DocumentsEntry } from "@/components/documents-entry";
import { useMe } from "@/components/guard";
import { Badge, Button } from "@/components/ui";
import { api, usePoll } from "@/lib/hooks";
import { formatDate, money, stars } from "@/lib/format";

type ProApi = {
  today?: number;
  month?: number;
  missions?: number;
  rating?: number;
  availability?: { availableNow?: boolean; label?: string; reason?: string; backAt?: string | null };
  offer?: { id: string } | null;
  openRequests?: number;
};

export default function ProHome() {
  const { data: me, reload: reloadMe } = useMe();
  const { data, reload } = usePoll<ProApi>("/api/pro", 3000);
  const { data: reqData } = usePoll<{ requests: { id: string }[] }>("/api/requests", 5000);
  const { data: missionsData } = usePoll<{ missions: { id: string; status: string }[] }>("/api/missions", 5000);
  const pro = me?.pro as
    | (NonNullable<typeof me>["pro"] & {
        availability?: ProApi["availability"];
        tier?: string;
        premiumActive?: boolean;
        boostActive?: boolean;
      })
    | null
    | undefined;
  const pending = pro && pro.status !== "verified";
  const availability = pro?.availability ?? data?.availability;
  const onAbsence = availability?.reason === "absence";
  const openRequests = (reqData?.requests ?? []).length;
  const activeMissions = (missionsData?.missions ?? []).filter((m) =>
    ["accepted", "en_route", "arrived", "in_progress"].includes(m.status),
  ).length;

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
      <DocumentsEntry href="/pro/factures" />

      {pending ? (
        <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-4 md:max-w-xl">
          <div className="font-bold">Compte en cours de vérification</div>
          <p className="mt-1 text-sm">
            Déposez identité, Kbis et RC Pro, puis soumettez le dossier.
          </p>
          <Button href="/pro/verification" className="mt-3" variant="secondary">
            Ouvrir ma vérification
          </Button>
        </div>
      ) : (
        <>
          {onAbsence ? (
            <div className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 p-4 md:max-w-xl">
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
                : "Touchez pour vous rendre disponible."}
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
            {pro?.tier === "elite" ? <Badge tone="premium">Elite</Badge> : null}
            {pro?.tier === "prime" || pro?.premiumActive ? <Badge tone="premium">Prime</Badge> : null}
            {pro?.boostActive ? <Badge tone="orange">Boost</Badge> : null}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 md:max-w-xl">
            <Link
              href="/pro/demandes"
              className="rounded-3xl border border-line bg-card p-4 transition hover:border-appo/40"
            >
              <div className="text-xs font-bold uppercase tracking-wide text-muted">À traiter</div>
              <div className="mt-1 text-2xl font-black">{openRequests}</div>
              <div className="text-sm text-muted">demande{openRequests === 1 ? "" : "s"} client</div>
            </Link>
            <Link
              href="/pro/missions"
              className="rounded-3xl border border-line bg-card p-4 transition hover:border-appo/40"
            >
              <div className="text-xs font-bold uppercase tracking-wide text-muted">En cours</div>
              <div className="mt-1 text-2xl font-black">{activeMissions}</div>
              <div className="text-sm text-muted">mission{activeMissions === 1 ? "" : "s"} active{activeMissions === 1 ? "" : "s"}</div>
            </Link>
          </div>

          <div className="mt-6 md:max-w-xl">
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

          <div className="mt-6 grid grid-cols-2 gap-2 md:max-w-xl">
            <Button href="/pro/planning" variant="secondary" className="w-full">
              Planning
            </Button>
            <Button href="/pro/revenus" variant="secondary" className="w-full">
              Revenus
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm md:max-w-xl">
            <Link href="/pro/premium" className="font-semibold text-appo">
              {pro?.tier === "pro" && !pro?.premiumActive ? "Passer Prime →" : "Offres Prime / Boost →"}
            </Link>
            <Link href="/pro/business" className="font-semibold text-muted">
              Business →
            </Link>
            <Link href="/pro/profil" className="font-semibold text-muted">
              Profil →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

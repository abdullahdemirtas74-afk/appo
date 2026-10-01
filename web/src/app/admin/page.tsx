"use client";

import Link from "next/link";
import { api, usePoll } from "@/lib/hooks";
import { STATUS_LABELS, formatDate, money, moneyExact } from "@/lib/format";
import { Badge, Button } from "@/components/ui";

type Activity = {
  id: string;
  at: string;
  kind: string;
  title: string;
  detail: string;
  href: string;
  tone?: "ok" | "warn" | "danger" | "info";
};

const KIND_LABEL: Record<string, string> = {
  mission: "Mission",
  request: "Demande",
  payment: "Paiement",
  invoice: "Facture",
  dispute: "Litige",
  support: "Support",
  pro: "Pro",
  client: "Client",
};

const toneClass: Record<string, string> = {
  ok: "bg-emerald-50 text-emerald-800 border-emerald-200",
  warn: "bg-amber-50 text-amber-900 border-amber-200",
  danger: "bg-red-50 text-red-800 border-red-200",
  info: "bg-sky-50 text-sky-900 border-sky-200",
};

export default function AdminHome() {
  const { data, reload } = usePoll<{
    userCount?: number;
    clientCount?: number;
    proCount?: number;
    activePros?: number;
    pendingPros?: number;
    pendingDocs?: number;
    missionCount?: number;
    liveMissions?: number;
    openRequests?: number;
    openDisputes?: number;
    openTickets?: number;
    invoiceCount?: number;
    quoteCount?: number;
    volume?: number;
    revenue?: number;
    heldFunds?: number;
    averageBasket?: number;
    cancelRate?: number;
    conversion?: number;
    settings?: {
      commissionRate?: number;
      offerSeconds?: number;
      rfqPrimeExclusiveMinutes?: number;
    };
    activity?: Activity[];
    liveMissionList?: any[];
    attention?: Record<string, number>;
    requests?: any[];
    disputes?: any[];
    pros?: any[];
    supportTickets?: any[];
  }>("/api/admin", 3000);

  const cards = [
    ["Clients", data?.clientCount],
    ["Pros", data?.proCount],
    ["Pros en ligne", data?.activePros],
    ["En validation", data?.pendingPros],
    ["Missions live", data?.liveMissions],
    ["Demandes ouvertes", data?.openRequests],
    ["Litiges ouverts", data?.openDisputes],
    ["Tickets support", data?.openTickets],
    ["Volume payé", moneyExact(data?.volume ?? 0)],
    ["CA AppO", moneyExact(data?.revenue ?? 0)],
    ["Fonds en séquestre", moneyExact(data?.heldFunds ?? 0)],
    ["Taux d’annulation", `${Math.round((data?.cancelRate ?? 0) * 100)} %`],
  ];

  const attention = [
    { label: "Pros à valider", n: data?.attention?.pendingPros ?? 0, href: "/admin/pros" },
    { label: "Docs à revoir", n: data?.attention?.pendingDocs ?? 0, href: "/admin/pros" },
    { label: "Litiges", n: data?.attention?.openDisputes ?? 0, href: "/admin/litiges" },
    { label: "Support", n: data?.attention?.openTickets ?? 0, href: "/admin/litiges" },
    { label: "Demandes RFQ", n: data?.attention?.openRequests ?? 0, href: "/admin/missions" },
    { label: "Missions live", n: data?.attention?.liveMissions ?? 0, href: "/admin/missions" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Tout ce qui se passe</h1>
          <p className="text-sm text-muted">
            Vue live de la plateforme · rafraîchie toutes les 3 s
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={async () => {
              const res = await fetch("/api/admin?export=1");
              const json = await res.json();
              if (!res.ok) {
                alert(json.error || "Export impossible");
                return;
              }
              const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `appo-backup-${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Export backup
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              const typed = prompt("Tapez RESET pour confirmer la réinitialisation (exportez avant) :");
              if (typed !== "RESET") return;
              await api("/api/admin", { action: "reset", confirm: "RESET" });
              reload();
            }}
          >
            Reset démo
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map(([k, v]) => (
          <div key={String(k)} className="rounded-3xl border border-line bg-white p-4">
            <div className="text-xs text-muted">{k}</div>
            <div className="text-2xl font-black">{v ?? "—"}</div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="font-bold">À traiter maintenant</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {attention.map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className={`rounded-2xl border px-4 py-3 transition hover:border-appo/40 ${
                a.n > 0 ? "border-amber-200 bg-amber-50" : "border-line bg-white"
              }`}
            >
              <div className="text-xs font-semibold uppercase tracking-wide text-muted">{a.label}</div>
              <div className="text-2xl font-black">{a.n}</div>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-line bg-white p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-bold">Missions en cours</h2>
            <Link href="/admin/missions" className="text-sm font-semibold text-appo">
              Tout voir →
            </Link>
          </div>
          <div className="mt-3 space-y-2">
            {(data?.liveMissionList ?? []).length === 0 ? (
              <p className="text-sm text-muted">Aucune mission live.</p>
            ) : (
              (data?.liveMissionList ?? []).slice(0, 8).map((m: any) => (
                <div key={m.id} className="rounded-2xl border border-line px-3 py-2.5 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold">
                      {m.category?.name ?? "Mission"} · {m.city}
                    </span>
                    <Badge>{STATUS_LABELS[m.status] ?? m.status}</Badge>
                  </div>
                  <div className="mt-1 text-xs text-muted">
                    {m.client?.firstName ?? "Client"} → {m.pro?.user?.firstName ?? "en matching"} ·{" "}
                    {money(m.total ?? m.price ?? 0)} · {formatDate(m.createdAt)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-line bg-white p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-bold">Fil d’activité</h2>
            <span className="text-xs font-semibold text-muted">Live</span>
          </div>
          <div className="mt-3 max-h-[28rem] space-y-2 overflow-y-auto pr-1">
            {(data?.activity ?? []).length === 0 ? (
              <p className="text-sm text-muted">Pas encore d’événements.</p>
            ) : (
              (data?.activity ?? []).map((a) => (
                <Link
                  key={a.id}
                  href={a.href}
                  className={`block rounded-2xl border px-3 py-2.5 text-sm transition hover:border-appo/40 ${
                    toneClass[a.tone ?? "info"]
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wide opacity-70">
                      {KIND_LABEL[a.kind] ?? a.kind}
                    </span>
                    <span className="text-[11px] opacity-70">{formatDate(a.at)}</span>
                  </div>
                  <div className="mt-0.5 font-semibold">{a.title}</div>
                  {a.detail ? <div className="text-xs opacity-80">{a.detail}</div> : null}
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-line bg-white p-5">
          <h2 className="font-bold">Pros en attente</h2>
          <div className="mt-3 space-y-2">
            {(data?.pros ?? [])
              .filter((p: any) => p.status === "pending")
              .slice(0, 6)
              .map((p: any) => (
                <Link key={p.id} href="/admin/pros" className="block rounded-2xl border border-line px-3 py-2 text-sm">
                  <div className="font-semibold">{p.company}</div>
                  <div className="text-xs text-muted">
                    {p.user?.firstName} · {p.city} · docs {p.docsReadyForReview ? "prêts" : "incomplets"}
                  </div>
                </Link>
              ))}
            {(data?.pros ?? []).filter((p: any) => p.status === "pending").length === 0 ? (
              <p className="text-sm text-muted">Aucun dossier en attente.</p>
            ) : null}
          </div>
        </div>

        <div className="rounded-3xl border border-line bg-white p-5">
          <h2 className="font-bold">Demandes RFQ</h2>
          <div className="mt-3 space-y-2">
            {(data?.requests ?? [])
              .filter((r: any) => r.status === "open")
              .slice(0, 6)
              .map((r: any) => (
                <div key={r.id} className="rounded-2xl border border-line px-3 py-2 text-sm">
                  <div className="font-semibold">
                    {r.category?.name ?? "Service"} · {r.city}
                  </div>
                  <div className="text-xs text-muted">
                    {r.client?.firstName} · {r.offerCount ?? 0} offre(s) · {formatDate(r.createdAt)}
                  </div>
                </div>
              ))}
            {(data?.requests ?? []).filter((r: any) => r.status === "open").length === 0 ? (
              <p className="text-sm text-muted">Aucune demande ouverte.</p>
            ) : null}
          </div>
        </div>

        <div className="rounded-3xl border border-line bg-white p-5">
          <h2 className="font-bold">Litiges & support</h2>
          <div className="mt-3 space-y-2">
            {(data?.disputes ?? [])
              .filter((d: any) => d.status === "open" || d.status === "in_review")
              .slice(0, 4)
              .map((d: any) => (
                <Link key={d.id} href="/admin/litiges" className="block rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm">
                  <div className="font-semibold">Litige · {d.status}</div>
                  <div className="text-xs text-muted line-clamp-2">{d.reason}</div>
                </Link>
              ))}
            {(data?.supportTickets ?? [])
              .filter((t: any) => t.status === "open" || t.status === "in_review")
              .slice(0, 4)
              .map((t: any) => (
                <Link key={t.id} href="/admin/litiges" className="block rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
                  <div className="font-semibold">Ticket · {t.subject}</div>
                  <div className="text-xs text-muted">{t.category} · {formatDate(t.updatedAt ?? t.createdAt)}</div>
                </Link>
              ))}
            {(data?.disputes ?? []).filter((d: any) => d.status === "open" || d.status === "in_review").length === 0 &&
            (data?.supportTickets ?? []).filter((t: any) => t.status === "open" || t.status === "in_review").length === 0 ? (
              <p className="text-sm text-muted">Rien à traiter.</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-line bg-white p-5">
        <h2 className="font-bold">Commission & matching</h2>
        <p className="text-sm text-muted">
          Commission : {Math.round((data?.settings?.commissionRate ?? 0.15) * 100)} % · Now :{" "}
          {data?.settings?.offerSeconds}s · RFQ Prime : {data?.settings?.rfqPrimeExclusiveMinutes ?? 5} min · Conversion :{" "}
          {Math.round((data?.conversion ?? 0) * 100)} % · Factures : {data?.invoiceCount ?? 0} · Devis :{" "}
          {data?.quoteCount ?? 0}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
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
            Timer Now 20s
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              await api("/api/admin", { action: "settings", offerSeconds: 30 });
              reload();
            }}
          >
            Timer Now 30s
          </Button>
        </div>
      </div>
    </div>
  );
}

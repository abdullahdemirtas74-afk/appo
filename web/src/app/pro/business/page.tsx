"use client";

import { useState } from "react";
import { useMe } from "@/components/guard";
import { Badge, Button, Field, inputClass } from "@/components/ui";
import { api, usePoll } from "@/lib/hooks";

export default function BusinessPage() {
  const { data: me, reload: reloadMe } = useMe();
  const { data: stats, reload } = usePoll<any>("/api/pro", 4000);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState("");
  const enabled = stats?.businessEnabled ?? (me?.pro as any)?.businessEnabled;
  const team = stats?.team ?? (me?.pro as any)?.team ?? [];
  const missions = (stats as any)?.openMissions ?? [];

  async function refresh() {
    await reload();
    await reloadMe();
  }

  return (
    <div className="px-4 py-5 sm:px-6 md:px-8 md:py-8">
      <h1 className="text-2xl font-extrabold md:text-3xl">AppO Business 🏢</h1>
      <p className="mt-1 text-sm text-muted">
        Comptes multi-intervenants : équipe et attribution des missions.
      </p>

      <div className="mt-5 rounded-3xl border border-line bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-bold">Mode entreprise</div>
            <p className="text-sm text-muted">Activez pour gérer plusieurs salariés / intervenants.</p>
          </div>
          <Button
            variant={enabled ? "secondary" : "now"}
            onClick={async () => {
              await api("/api/pro", { action: "setBusiness", businessEnabled: !enabled });
              setMsg(enabled ? "Mode entreprise désactivé" : "Mode entreprise activé");
              await refresh();
            }}
          >
            {enabled ? "Désactiver" : "Activer"}
          </Button>
        </div>
        {enabled ? <Badge tone="green">Actif</Badge> : null}
      </div>

      {enabled ? (
        <>
          <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-muted">Équipe</h2>
          <div className="mt-3 space-y-2">
            {team.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between rounded-2xl border border-line bg-card px-4 py-3">
                <div>
                  <div className="font-semibold">
                    {m.name} {m.role === "owner" ? <Badge>Titulaire</Badge> : null}
                  </div>
                  <div className="text-sm text-muted">{m.phone || "—"}</div>
                </div>
                {m.role !== "owner" ? (
                  <button
                    className="text-sm font-semibold text-red-600"
                    onClick={async () => {
                      await api("/api/pro", { action: "removeTeamMember", memberId: m.id });
                      await refresh();
                    }}
                  >
                    Retirer
                  </button>
                ) : null}
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-3 rounded-3xl border border-line p-4">
            <Field label="Nom intervenant">
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Téléphone">
              <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
            <Button
              className="w-full"
              variant="dark"
              onClick={async () => {
                if (!name.trim()) return;
                await api("/api/pro", { action: "addTeamMember", name, phone });
                setName("");
                setPhone("");
                setMsg("Intervenant ajouté");
                await refresh();
              }}
            >
              Ajouter un intervenant
            </Button>
          </div>

          <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-muted">Attribution</h2>
          <p className="mt-1 text-sm text-muted">Assignez une mission ouverte à un membre depuis la fiche mission.</p>
          {(missions as any[])?.length ? (
            <div className="mt-3 space-y-2">
              {missions.map((m: any) => (
                <a key={m.id} href={`/pro/missions/${m.id}`} className="block rounded-2xl border border-line p-3 text-sm">
                  {m.category?.name ?? "Mission"} · {m.status}
                </a>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted">Aucune mission ouverte pour le moment.</p>
          )}
        </>
      ) : null}
      {msg ? <p className="mt-4 text-sm font-semibold text-appo">{msg}</p> : null}
    </div>
  );
}

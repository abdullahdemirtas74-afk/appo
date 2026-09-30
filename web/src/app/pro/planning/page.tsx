"use client";

import { useMemo, useState } from "react";
import { useMe } from "@/components/guard";
import { Badge, Button, Field, inputClass } from "@/components/ui";
import { DAY_LABELS, formatDate, STATUS_LABELS } from "@/lib/format";
import { api, usePoll } from "@/lib/hooks";

const REASONS = [
  { id: "conges", label: "Congés" },
  { id: "maladie", label: "Maladie" },
  { id: "formation", label: "Formation" },
  { id: "pause", label: "Pause courte" },
  { id: "autre", label: "Autre" },
];

function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function PlanningPage() {
  const { data: me, reload } = useMe();
  const { data } = usePoll<{ missions: any[] }>("/api/missions", 5000);
  const { data: stats, reload: reloadStats } = usePoll<any>("/api/pro", 4000);
  const pro = me?.pro;
  const schedule = pro?.schedule ?? [];
  const absences = pro?.absences ?? [];
  const availability = (pro as any)?.availability ?? stats?.availability;

  const [startAt, setStartAt] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
    return toLocalInput(d);
  });
  const [endAt, setEndAt] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 8);
    d.setHours(23, 0, 0, 0);
    return toLocalInput(d);
  });
  const [reason, setReason] = useState("conges");
  const [note, setNote] = useState("");
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const future = useMemo(
    () =>
      (data?.missions ?? []).filter(
        (m) =>
          ["accepted", "offered", "en_route", "arrived"].includes(m.status) ||
          m.type === "scheduled",
      ),
    [data],
  );

  async function refresh() {
    await reload();
    await reloadStats();
  }

  async function addAbsence() {
    setSaving(true);
    setError("");
    try {
      const res = await api<{ conflicts?: any[] }>("/api/pro", {
        action: "addAbsence",
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        reason,
        note,
      });
      setConflicts(res.conflicts ?? []);
      setNote("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="px-5 py-6 pb-10">
      <h1 className="text-2xl font-extrabold">Planning</h1>
      <p className="mt-1 text-sm text-muted">
        Horaires, absences et capacité. En congé = aucune alerte AppO Now.
      </p>

      {availability ? (
        <div
          className={`mt-4 rounded-3xl p-4 text-sm ${
            availability.availableNow ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"
          }`}
        >
          <div className="font-bold">{availability.label}</div>
          {availability.backAt ? (
            <div className="mt-1">Reprise estimée : {formatDate(availability.backAt)}</div>
          ) : null}
          {!availability.availableNow ? (
            <div className="mt-1 opacity-80">Vous ne recevez pas de missions AppO Now.</div>
          ) : null}
        </div>
      ) : null}

      <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-muted">Horaires hebdo</h2>
      <div className="mt-3 divide-y divide-line rounded-3xl border border-line bg-card md:grid md:grid-cols-2 md:divide-y-0 lg:grid-cols-3">
        {schedule.map((s: any) => (
          <div key={s.day} className="border-line px-4 py-3 md:border-b">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{DAY_LABELS[s.day]}</div>
                <div className="text-sm text-muted">
                  {s.available ? `${s.start}–${s.end}` : "Fermé"}
                  {s.available && s.breakStart && s.breakEnd
                    ? ` · pause ${s.breakStart}–${s.breakEnd}`
                    : ""}
                </div>
              </div>
              <button
                className="text-sm font-semibold text-appo"
                onClick={async () => {
                  const next = schedule.map((d: any) =>
                    d.day === s.day
                      ? {
                          ...d,
                          available: !d.available,
                          breakStart: !d.available ? "12:00" : null,
                          breakEnd: !d.available ? "13:00" : null,
                        }
                      : d,
                  );
                  await api("/api/pro", { schedule: next });
                  await refresh();
                }}
              >
                {s.available ? "Fermer" : "Ouvrir"}
              </button>
            </div>
            {s.available ? (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input
                  className={inputClass + " py-2 text-sm"}
                  type="time"
                  value={s.start}
                  onChange={async (e) => {
                    const next = schedule.map((d: any) =>
                      d.day === s.day ? { ...d, start: e.target.value } : d,
                    );
                    await api("/api/pro", { schedule: next });
                    await refresh();
                  }}
                />
                <input
                  className={inputClass + " py-2 text-sm"}
                  type="time"
                  value={s.end}
                  onChange={async (e) => {
                    const next = schedule.map((d: any) =>
                      d.day === s.day ? { ...d, end: e.target.value } : d,
                    );
                    await api("/api/pro", { schedule: next });
                    await refresh();
                  }}
                />
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-muted md:mt-10">
        Congés & absences
      </h2>
      <div className="mt-3 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-3 rounded-3xl border border-line bg-card p-4">
        <Field label="Début">
          <input
            className={inputClass}
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
          />
        </Field>
        <Field label="Fin">
          <input
            className={inputClass}
            type="datetime-local"
            value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
          />
        </Field>
        <Field label="Motif">
          <select className={inputClass} value={reason} onChange={(e) => setReason(e.target.value)}>
            {REASONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Note (optionnel)">
          <input className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        {error ? (
          <p className="text-sm text-red-600">
            {error === "INVALID_ABSENCE" ? "Dates invalides" : error === "ON_ABSENCE" ? "Vous êtes en absence" : error}
          </p>
        ) : null}
        <Button className="w-full" variant="dark" disabled={saving} onClick={addAbsence}>
          {saving ? "Enregistrement…" : "Ajouter l’absence"}
        </Button>
        <p className="text-xs text-muted">
          Pendant une absence : hors matching AppO Now, aucune alerte nouvelle mission, badge
          “indisponible” côté client.
        </p>
      </div>

      <div className="space-y-4">
      {conflicts.length ? (
        <div className="rounded-3xl border border-orange-200 bg-orange-50 p-4 text-sm">
          <div className="font-bold">Attention — missions déjà acceptées sur cette période</div>
          <ul className="mt-2 space-y-1">
            {conflicts.map((m) => (
              <li key={m.id}>
                <a className="text-appo underline" href={`/pro/missions/${m.id}`}>
                  {m.category?.name} · {STATUS_LABELS[m.status]} · {formatDate(m.scheduledAt || m.createdAt)}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-muted">Contactez le client pour replanifier ou annuler.</p>
        </div>
      ) : null}

      <div className="space-y-2">
        {absences.length === 0 ? (
          <p className="text-sm text-muted">Aucune absence planifiée.</p>
        ) : (
          absences.map((a: any) => (
            <div key={a.id} className="flex items-start justify-between rounded-2xl border border-line bg-card p-3">
              <div>
                <div className="font-semibold">
                  {REASONS.find((r) => r.id === a.reason)?.label ?? a.reason}
                </div>
                <div className="text-sm text-muted">
                  {formatDate(a.startAt)} → {formatDate(a.endAt)}
                </div>
                {a.note ? <div className="text-sm">{a.note}</div> : null}
              </div>
              <button
                className="text-sm font-semibold text-red-600"
                onClick={async () => {
                  await api("/api/pro", { action: "removeAbsence", absenceId: a.id });
                  await refresh();
                }}
              >
                Supprimer
              </button>
            </div>
          ))
        )}
      </div>
      </div>
      </div>

      <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-muted">Règles</h2>
      <div className="mt-3 space-y-3 rounded-3xl border border-line p-4">
        <Field label="Délai mini avant réservation planifiée (heures)">
          <input
            className={inputClass}
            type="number"
            min={0}
            value={pro?.leadTimeHours ?? 2}
            onChange={async (e) => {
              await api("/api/pro", { leadTimeHours: Number(e.target.value) });
              await refresh();
            }}
          />
        </Field>
        <Field label="Buffer entre deux RDV (minutes)">
          <input
            className={inputClass}
            type="number"
            min={0}
            value={pro?.bufferMinutes ?? 30}
            onChange={async (e) => {
              await api("/api/pro", { bufferMinutes: Number(e.target.value) });
              await refresh();
            }}
          />
        </Field>
        <Field label="Missions max par jour">
          <input
            className={inputClass}
            type="number"
            min={1}
            max={10}
            value={pro?.maxMissionsPerDay ?? 1}
            onChange={async (e) => {
              await api("/api/pro", { maxMissionsPerDay: Number(e.target.value) });
              await refresh();
            }}
          />
        </Field>
      </div>

      <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-muted">Promos créneaux libres</h2>
      <div className="mt-3 space-y-3 rounded-3xl border border-line p-4">
        <p className="text-sm text-muted">Proposez automatiquement −10% (ou plus) sur vos trous de planning.</p>
        <Button
          className="w-full"
          variant="secondary"
          onClick={async () => {
            await api("/api/growth", {
              action: "upsertSlotPromo",
              day: new Date().getDay(),
              start: "14:00",
              end: "17:00",
              percentOff: 10,
              active: true,
            });
            alert("Promo créneau activée pour cet après-midi type.");
          }}
        >
          Activer −10% 14h–17h
        </Button>
      </div>

      <h2 className="mt-8 font-bold">Réservations à venir</h2>
      <div className="mt-3 space-y-2">
        {future.map((m) => (
          <a
            key={m.id}
            href={`/pro/missions/${m.id}`}
            className="block rounded-2xl border border-line p-3 text-sm"
          >
            <div className="flex items-center justify-between">
              <b>{m.category?.name}</b>
              <Badge>{STATUS_LABELS[m.status]}</Badge>
            </div>
            <div className="text-muted">{formatDate(m.scheduledAt || m.createdAt)}</div>
          </a>
        ))}
        {!future.length ? <p className="text-sm text-muted">Aucune réservation à venir.</p> : null}
      </div>
    </div>
  );
}

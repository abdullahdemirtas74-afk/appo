"use client";

import { Button, Field, inputClass } from "@/components/ui";
import { api, usePoll } from "@/lib/hooks";
import { formatDate, money } from "@/lib/format";
import { useState } from "react";

export default function RecurringPage() {
  const { data: cats } = usePoll<{ categories: any[] }>("/api/categories", 0);
  const { data, reload } = usePoll<any>("/api/growth", 4000);
  const [form, setForm] = useState({
    categoryId: "cat_menage",
    frequency: "weekly",
    preferredDay: "2",
    preferredHour: "10:00",
    description: "Ménage hebdomadaire",
    price: 45,
    address: "12 rue de la République",
    city: "Rumilly",
  });

  return (
    <div className="px-5 py-6 pb-10">
      <h1 className="text-2xl font-extrabold">Prestations récurrentes</h1>
      <p className="mt-1 text-sm text-muted">Ménage, jardin, entretien — planifiez automatiquement.</p>

      <div className="mt-4 space-y-3 rounded-3xl border border-line p-4">
        <Field label="Service">
          <select className={inputClass} value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
            {(cats?.categories ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Fréquence">
          <select className={inputClass} value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
            <option value="weekly">Chaque semaine</option>
            <option value="biweekly">Toutes les 2 semaines</option>
            <option value="monthly">Chaque mois</option>
          </select>
        </Field>
        <Field label="Description">
          <input className={inputClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <Field label="Prix indicatif (€)">
          <input className={inputClass} type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
        </Field>
        <Button
          className="w-full"
          onClick={async () => {
            await api("/api/growth", {
              action: "createRecurring",
              ...form,
              preferredDay: Number(form.preferredDay),
              lat: 45.8782,
              lng: 6.0581,
            });
            reload();
          }}
        >
          Créer le plan
        </Button>
      </div>

      <h2 className="mt-6 font-bold">Mes plans</h2>
      <div className="mt-2 space-y-2">
        {(data?.recurringPlans ?? []).map((p: any) => (
          <div key={p.id} className="rounded-2xl border border-line p-4 text-sm">
            <div className="font-bold">{p.description}</div>
            <div className="text-muted">
              {p.frequency} · {money(p.price)} · prochain {formatDate(p.nextAt)} · {p.active ? "actif" : "pause"}
            </div>
            <div className="mt-2 flex gap-2">
              <Button variant="secondary" onClick={async () => { await api("/api/growth", { action: "toggleRecurring", id: p.id, active: !p.active }); reload(); }}>
                {p.active ? "Mettre en pause" : "Réactiver"}
              </Button>
              <Button
                variant="now"
                onClick={async () => {
                  const res = await api<any>("/api/growth", { action: "runRecurringNow", id: p.id });
                  if (res.mission?.id) window.location.href = `/app/missions/${res.mission.id}`;
                  else reload();
                }}
              >
                Générer la prochaine
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

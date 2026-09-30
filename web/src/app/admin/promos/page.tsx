"use client";

import { Button, Field, inputClass } from "@/components/ui";
import { api, usePoll } from "@/lib/hooks";
import { formatDate, moneyExact } from "@/lib/format";
import { useState } from "react";

export default function AdminPromosPage() {
  const { data, reload } = usePoll<any>("/api/growth", 4000);
  const [form, setForm] = useState({ code: "NOUVEAU15", type: "percent", value: 15, maxRedemptions: 100, city: "" });

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Codes promo</h1>
      <p className="text-sm text-muted">Campagnes locales et codes nationaux (démo).</p>
      <div className="mt-4 grid gap-3 rounded-3xl border border-line bg-white p-4 sm:grid-cols-2">
        <Field label="Code">
          <input className={inputClass} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        </Field>
        <Field label="Type">
          <select className={inputClass} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="percent">Pourcentage</option>
            <option value="fixed">Montant fixe €</option>
          </select>
        </Field>
        <Field label="Valeur">
          <input className={inputClass} type="number" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} />
        </Field>
        <Field label="Ville (optionnel)">
          <input className={inputClass} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Rumilly" />
        </Field>
        <Button
          className="sm:col-span-2"
          onClick={async () => {
            await api("/api/growth", { action: "adminCreatePromo", ...form, city: form.city || null });
            reload();
          }}
        >
          Créer le code
        </Button>
      </div>
      <div className="mt-4 space-y-2">
        {(data?.promoCodes ?? []).map((p: any) => (
          <div key={p.id} className="rounded-2xl border border-line bg-white px-4 py-3 text-sm">
            <b>{p.code}</b> · {p.type === "percent" ? `${p.value}%` : moneyExact(p.value)} · {p.redemptionCount}/{p.maxRedemptions}
            {p.city ? ` · ${p.city}` : ""} · {p.active ? "actif" : "off"} · {formatDate(p.createdAt)}
          </div>
        ))}
      </div>
    </div>
  );
}

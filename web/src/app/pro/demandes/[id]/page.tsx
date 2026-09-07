"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { Badge, Button, Field, inputClass } from "@/components/ui";
import { api, usePoll } from "@/lib/hooks";
import { formatDate, money } from "@/lib/format";

function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ProDemandeDetail() {
  const { id } = useParams<{ id: string }>();
  const { data, reload } = usePoll<{ request: any }>(id ? `/api/requests/${id}` : null, 4000);
  const r = data?.request;
  const [price, setPrice] = useState(120);
  const [proposedAt, setProposedAt] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    return toLocalInput(d);
  });
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [message, setMessage] = useState("Je peux intervenir rapidement avec le matériel adapté.");
  const [materialsIncluded, setMaterialsIncluded] = useState<"yes" | "no" | "partial">("yes");
  const [materialsNote, setMaterialsNote] = useState("Robinet fourni");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!r) return <div className="p-6 text-muted">Chargement…</div>;

  const mine = r.myOffer;

  async function submit() {
    setSaving(true);
    setError("");
    try {
      await api(`/api/requests/${r.id}`, {
        action: "submitOffer",
        price,
        proposedAt: new Date(proposedAt).toISOString(),
        durationMinutes,
        message,
        materialsIncluded,
        materialsNote,
      });
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="px-4 py-5 sm:px-6 md:px-8 md:py-8">
      <div className="text-xs font-bold uppercase text-appo">Demande client</div>
      <h1 className="mt-1 text-2xl font-extrabold">{r.category?.name}</h1>
      <p className="mt-2 text-sm leading-relaxed">{r.description}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted">
        <span>📍 {r.address}, {r.city}</span>
        <span>· Dispo : {r.availabilityNote}</span>
        {r.primeWindowOpen ? <Badge tone="premium">Fenêtre Prime</Badge> : null}
      </div>
      {r.photos?.[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={r.photos[0]} alt="" className="mt-4 h-36 rounded-2xl object-cover" />
      ) : null}

      {mine ? (
        <div className="mt-6 rounded-3xl border border-green/30 bg-emerald-50 p-4">
          <div className="font-bold">Votre offre · {money(mine.price)}</div>
          <div className="mt-1 text-sm">
            {formatDate(mine.proposedAt)} · ~{mine.durationMinutes} min · matériel{" "}
            {mine.materialsIncluded === "yes" ? "compris" : mine.materialsIncluded === "partial" ? "partiel" : "non compris"}
          </div>
          <p className="mt-2 text-sm">{mine.message}</p>
          <Badge>{mine.status}</Badge>
        </div>
      ) : null}

      {r.status === "open" ? (
        <div className="mt-6 max-w-lg space-y-3 rounded-3xl border border-line bg-card p-4">
          <div className="font-bold">{mine ? "Modifier votre offre" : "Envoyer une offre"}</div>
          <Field label="Prix total (€)">
            <input className={inputClass} type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
          </Field>
          <Field label="Intervention proposée">
            <input className={inputClass} type="datetime-local" value={proposedAt} onChange={(e) => setProposedAt(e.target.value)} />
          </Field>
          <Field label="Durée estimée (min)">
            <input
              className={inputClass}
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
            />
          </Field>
          <Field label="Matériel">
            <select
              className={inputClass}
              value={materialsIncluded}
              onChange={(e) => setMaterialsIncluded(e.target.value as "yes" | "no" | "partial")}
            >
              <option value="yes">Compris dans le prix</option>
              <option value="partial">Partiellement compris</option>
              <option value="no">Non compris</option>
            </select>
          </Field>
          <Field label="Précision matériel">
            <input className={inputClass} value={materialsNote} onChange={(e) => setMaterialsNote(e.target.value)} />
          </Field>
          <Field label="Message au client">
            <textarea className={inputClass} rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
          </Field>
          {error ? <p className="text-sm text-red-600">{error === "FORBIDDEN" ? "Pas encore accessible (fenêtre Prime)" : error}</p> : null}
          <Button className="w-full" variant="now" disabled={saving} onClick={submit}>
            {saving ? "Envoi…" : mine ? "Mettre à jour" : "Envoyer l’offre"}
          </Button>
        </div>
      ) : (
        <p className="mt-6 text-sm text-muted">Cette demande n’accepte plus d’offres ({r.status}).</p>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge, Button, Field, inputClass } from "@/components/ui";
import { api, usePoll } from "@/lib/hooks";

const STATUS: Record<string, string> = {
  open: "Ouvert",
  in_review: "En cours",
  resolved: "Résolu",
  closed: "Clos",
};

export default function SupportPage() {
  const { data, reload } = usePoll<{ disputes: any[]; tickets: any[] }>("/api/support", 4000);
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("autre");
  const [message, setMessage] = useState("");
  const [err, setErr] = useState("");

  const items = [
    ...(data?.disputes ?? []).map((d) => ({ ...d, href: `/app/support/${d.id}` })),
    ...(data?.tickets ?? []).map((t) => ({ ...t, href: `/app/support/${t.id}` })),
  ].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));

  return (
    <div className="px-5 py-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Aide & litiges</h1>
          <p className="mt-1 text-sm text-muted">Contactez le support AppO ou suivez un litige mission.</p>
        </div>
        <Button variant="now" onClick={() => setOpen(true)}>
          Nouveau
        </Button>
      </div>

      {open ? (
        <div className="mt-4 space-y-3 rounded-3xl border border-line p-4">
          <Field label="Sujet">
            <input className={inputClass} value={subject} onChange={(e) => setSubject(e.target.value)} />
          </Field>
          <Field label="Catégorie">
            <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="compte">Compte</option>
              <option value="paiement">Paiement</option>
              <option value="mission">Mission</option>
              <option value="pro">Professionnel</option>
              <option value="autre">Autre</option>
            </select>
          </Field>
          <Field label="Message">
            <textarea className={inputClass} rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
          </Field>
          {err ? <p className="text-sm text-red-600">{err}</p> : null}
          <div className="flex gap-2">
            <Button
              className="flex-1"
              variant="now"
              onClick={async () => {
                setErr("");
                try {
                  await api("/api/support", { action: "createTicket", subject, category, message });
                  setOpen(false);
                  setSubject("");
                  setMessage("");
                  reload();
                } catch (e) {
                  setErr(e instanceof Error ? e.message : "Erreur");
                }
              }}
            >
              Envoyer
            </Button>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Annuler
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mt-4 space-y-2">
        {items.length === 0 ? <p className="text-sm text-muted">Aucun ticket pour l’instant.</p> : null}
        {items.map((item: any) => (
          <Link key={item.id} href={item.href} className="block rounded-2xl border border-line px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="font-semibold">
                {item.kind === "dispute" ? `Litige · ${item.mission?.category?.name ?? item.missionId}` : item.subject}
              </div>
              <Badge tone={item.status === "open" ? "orange" : item.status === "resolved" || item.status === "closed" ? "green" : "neutral"}>
                {STATUS[item.status] ?? item.status}
              </Badge>
            </div>
            <p className="mt-1 truncate text-sm text-muted">{item.reason ?? item.messages?.at(-1)?.text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

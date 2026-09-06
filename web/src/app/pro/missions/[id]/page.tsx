"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { MiniMap } from "@/components/map";
import { Button, Field, inputClass } from "@/components/ui";
import { api, usePoll } from "@/lib/hooks";
import { STATUS_LABELS, formatTime, km, money } from "@/lib/format";

const NEXT: Record<string, { status: string; label: string }> = {
  accepted: { status: "en_route", label: "En route" },
  en_route: { status: "arrived", label: "Arrivé" },
  arrived: { status: "in_progress", label: "Commencer l’intervention" },
  in_progress: { status: "completed", label: "Terminer l’intervention" },
};

export default function ProMissionPage() {
  const { id } = useParams<{ id: string }>();
  const { data, reload } = usePoll<{ mission: any }>(id ? `/api/missions/${id}` : null, 2000);
  const [text, setText] = useState("");
  const [supp, setSupp] = useState(40);
  const [reason, setReason] = useState("Problème supplémentaire constaté");
  const m = data?.mission;
  if (!m) return <div className="p-6 text-muted">Chargement…</div>;
  const next = NEXT[m.status];

  const act = async (action: string, extra: Record<string, unknown> = {}) => {
    await api(`/api/missions/${m.id}`, { action, ...extra });
    reload();
  };

  return (
    <div className="px-5 py-6 pb-10">
      <div className="text-xs font-bold uppercase text-appo">{m.type === "now" ? "AppO Now" : "Planifiée"}</div>
      <h1 className="text-2xl font-extrabold">{m.category?.name}</h1>
      <p className="text-muted">{STATUS_LABELS[m.status]}</p>
      <div className="mt-4 rounded-3xl border border-line p-4">
        <div className="font-bold">{money(m.total)}</div>
        <p>📍 {m.address}, {m.city} {m.pro ? `· ${km(m.pro.distanceKm)}` : ""}</p>
        <p className="mt-1 text-sm">{m.description}</p>
        <p className="mt-1 text-sm">Client : {m.client?.firstName} {m.client?.lastName?.charAt(0)}.</p>
      </div>
      <div className="mt-4">
        <MiniMap lat={m.lat} lng={m.lng} />
      </div>
      {m.status === "offered" ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="now" onClick={() => act("accept")}>Accepter</Button>
          <Button variant="secondary" onClick={() => act("pass")}>Passer</Button>
        </div>
      ) : null}
      {next ? (
        <Button className="mt-4 w-full" variant="dark" onClick={() => act("status", { status: next.status })}>
          {next.label}
        </Button>
      ) : null}
      {["arrived", "in_progress"].includes(m.status) && m.pendingSupplement == null ? (
        <div className="mt-6 rounded-3xl bg-background p-4">
          <div className="font-bold">Demander un supplément</div>
          <Field label="Montant €">
            <input className={inputClass} type="number" value={supp} onChange={(e) => setSupp(Number(e.target.value))} />
          </Field>
          <Field label="Motif">
            <input className={inputClass} value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
          <Button className="mt-3 w-full" variant="secondary" onClick={() => act("supplement", { amount: supp, reason })}>
            Envoyer au client
          </Button>
        </div>
      ) : null}
      <div className="mt-6">
        <h2 className="font-bold">Messages</h2>
        <div className="mt-3 space-y-2">
          {(m.messages ?? []).map((msg: any) => (
            <div key={msg.id} className={`rounded-2xl px-3 py-2 text-sm ${msg.senderId !== m.clientId ? "ml-8 bg-ink text-white" : "mr-8 bg-background"}`}>
              {msg.text}
              <div className="text-[10px] opacity-70">{formatTime(msg.createdAt)}</div>
            </div>
          ))}
        </div>
        {m.proId ? (
          <div className="mt-3 flex gap-2">
            <input className={inputClass} value={text} onChange={(e) => setText(e.target.value)} />
            <Button
              onClick={async () => {
                if (!text.trim()) return;
                await act("message", { text });
                setText("");
              }}
            >
              Envoyer
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

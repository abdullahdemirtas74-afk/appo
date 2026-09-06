"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { Check, Phone, Star } from "lucide-react";
import { MiniMap } from "@/components/map";
import { Badge, Button, inputClass } from "@/components/ui";
import { api, usePoll } from "@/lib/hooks";
import { STATUS_LABELS, formatTime, money } from "@/lib/format";

const STEPS = ["accepted", "en_route", "arrived", "in_progress", "completed"];

export default function MissionClientPage() {
  const { id } = useParams<{ id: string }>();
  const { data, reload } = usePoll<{ mission: any }>(id ? `/api/missions/${id}` : null, 2000);
  const [text, setText] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [payMethod, setPayMethod] = useState("card");
  const m = data?.mission;
  if (!m) return <div className="p-6 text-muted">Chargement…</div>;

  const act = async (action: string, extra: Record<string, unknown> = {}) => {
    await api(`/api/missions/${m.id}`, { action, ...extra });
    reload();
  };

  const searching = m.status === "searching" || m.status === "offered";

  return (
    <div className="px-5 py-6 pb-10">
      {searching ? (
        <div className="py-10 text-center">
          <div className="relative mx-auto h-24 w-24">
            <div className="pulse-ring absolute inset-0 rounded-full bg-appo/40" />
            <div className="relative grid h-24 w-24 place-items-center rounded-full bg-appo text-2xl font-black text-white">O</div>
          </div>
          <h1 className="mt-6 text-xl font-extrabold">Recherche des professionnels…</h1>
          <p className="mt-2 text-sm text-muted">
            {m.status === "offered"
              ? `Un pro a ${m.remainingOffer}s pour accepter`
              : "AppO sélectionne les professionnels vérifiés autour de vous."}
          </p>
        </div>
      ) : m.status === "unmatched" ? (
        <div className="py-10 text-center">
          <h1 className="text-xl font-extrabold">Aucun professionnel disponible</h1>
          <p className="mt-2 text-sm text-muted">Essayez de planifier ou une autre catégorie.</p>
          <Button href="/app" className="mt-6" variant="now">
            Retour à l’accueil
          </Button>
        </div>
      ) : (
        <>
          <Badge tone="green">Mission confirmée ✅</Badge>
          <h1 className="mt-2 text-2xl font-extrabold">{m.category?.name}</h1>
          <p className="text-muted">{m.description}</p>
          {m.pro ? (
            <div className="mt-4 flex items-center justify-between rounded-3xl border border-line p-4">
              <div>
                <div className="font-bold">
                  {m.pro.user.firstName} {m.pro.user.lastName}
                </div>
                <div className="text-sm text-muted">{m.pro.company}</div>
                {m.live?.etaMinutes && m.status === "en_route" ? (
                  <div className="mt-1 text-sm font-semibold text-appo">
                    Arrive dans {m.live.etaMinutes} min
                  </div>
                ) : null}
              </div>
              <div className="flex gap-2">
                <a className="rounded-full border border-line p-2" href={`/app/missions/${m.id}#chat`}>
                  💬
                </a>
                <a className="rounded-full border border-line p-2" href={`tel:${m.pro.user.phone}`}>
                  <Phone size={16} />
                </a>
              </div>
            </div>
          ) : null}
          {m.live ? <div className="mt-4"><MiniMap lat={m.live.lat} lng={m.live.lng} label={m.address} /></div> : null}
          <div className="mt-6 space-y-3">
            {STEPS.map((s) => {
              const done = STEPS.indexOf(m.status) >= STEPS.indexOf(s) && !["cancelled", "unmatched", "searching", "offered"].includes(m.status);
              const current = m.status === s;
              return (
                <div key={s} className="flex items-center gap-3 text-sm">
                  <span className={`grid h-7 w-7 place-items-center rounded-full ${done || current ? "bg-green text-white" : "bg-zinc-200"}`}>
                    <Check size={14} />
                  </span>
                  <span className={current ? "font-bold" : "text-muted"}>{STATUS_LABELS[s]}</span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {m.pendingSupplement != null ? (
        <div className="mt-6 rounded-3xl border border-orange-200 bg-orange-50 p-4">
          <div className="font-bold">Supplément demandé : +{m.pendingSupplement} €</div>
          <p className="text-sm">{m.pendingSupplementReason}</p>
          <Button className="mt-3 w-full" variant="now" onClick={() => act("respondSupplement", { accept: true })}>
            Accepter le nouveau prix
          </Button>
          <Button className="mt-2 w-full" variant="secondary" onClick={() => act("respondSupplement", { accept: false })}>
            Refuser
          </Button>
        </div>
      ) : null}

      {m.status === "completed" && m.paymentStatus !== "paid" ? (
        <div className="mt-6 rounded-3xl bg-ink p-5 text-white">
          <div className="text-sm opacity-70">Intervention terminée</div>
          <div className="text-3xl font-black">{money(m.total)}</div>
          <div className="text-sm opacity-80">Paiement sécurisé · aucune carte stockée chez AppO</div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
            {[["card", "Carte"], ["apple_pay", "Apple Pay"], ["google_pay", "Google Pay"]].map(([id, label]) => (
              <button key={id} className={`rounded-xl py-2 ${payMethod === id ? "bg-appo" : "bg-white/10"}`} onClick={() => setPayMethod(id)}>
                {label}
              </button>
            ))}
          </div>
          <Button className="mt-4 w-full" variant="now" onClick={() => act("pay", { method: payMethod })}>
            Payer {money(m.total)}
          </Button>
        </div>
      ) : null}

      {m.paymentStatus === "paid" && !m.review ? (
        <div className="mt-6 rounded-3xl border border-line p-4">
          <h2 className="font-bold">Noter le professionnel</h2>
          <div className="mt-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setRating(n)}>
                <Star size={28} className={n <= rating ? "fill-amber-400 text-amber-400" : "text-zinc-300"} />
              </button>
            ))}
          </div>
          <textarea className={`${inputClass} mt-3`} rows={3} placeholder="Commentaire" value={comment} onChange={(e) => setComment(e.target.value)} />
          <Button className="mt-3 w-full" onClick={() => act("review", { rating, comment })}>
            Publier l’avis
          </Button>
        </div>
      ) : null}

      {m.paymentStatus === "paid" ? (
        <div className="mt-4 rounded-2xl bg-background p-4 text-sm">
          Facture {m.id} · {money(m.total)} · {m.paymentMethod}
        </div>
      ) : null}

      {!searching && m.pro ? (
        <div id="chat" className="mt-8">
          <h2 className="font-bold">Messages</h2>
          <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
            {(m.messages ?? []).map((msg: any) => (
              <div key={msg.id} className={`rounded-2xl px-3 py-2 text-sm ${msg.senderId === m.clientId ? "ml-8 bg-appo text-white" : "mr-8 bg-background"}`}>
                {msg.text}
                <div className="mt-1 text-[10px] opacity-70">{formatTime(msg.createdAt)}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input className={inputClass} value={text} onChange={(e) => setText(e.target.value)} placeholder="Votre message…" />
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
        </div>
      ) : null}
    </div>
  );
}

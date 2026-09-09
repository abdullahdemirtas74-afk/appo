"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Lock } from "lucide-react";
import { TrackingMap } from "@/components/map";
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
  const [gpsOk, setGpsOk] = useState(false);
  const [gpsErr, setGpsErr] = useState("");
  const lastSent = useRef(0);
  const m = data?.mission;

  useEffect(() => {
    if (!m || !["accepted", "en_route"].includes(m.status)) return;
    if (!navigator.geolocation) {
      setGpsErr("GPS non disponible sur cet appareil");
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        setGpsOk(true);
        setGpsErr("");
        const now = Date.now();
        if (now - lastSent.current < 5000) return;
        lastSent.current = now;
        try {
          await api(`/api/missions/${m.id}`, {
            action: "updatePosition",
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        } catch {
          /* ignore throttle / network */
        }
      },
      (err) => {
        setGpsOk(false);
        setGpsErr(err.message || "Autorisez la localisation");
      },
      { enableHighAccuracy: true, maximumAge: 4000, timeout: 15000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [m?.id, m?.status]);

  if (!m) return <div className="p-6 text-muted">Chargement…</div>;
  const next = NEXT[m.status];
  const unlocked = Boolean(m.contactsUnlocked);
  const offered = m.status === "offered";

  const act = async (action: string, extra: Record<string, unknown> = {}) => {
    await api(`/api/missions/${m.id}`, { action, ...extra });
    reload();
  };

  return (
    <div className="px-5 py-6 pb-10">
      <div className="text-xs font-bold uppercase text-appo">
        {m.client?.clientPlusActive ? "⭐ Client AppO+ · " : ""}
        {m.type === "urgence" ? "Urgence ⚡" : m.type === "now" ? "AppO Now" : m.isLargeWorks ? "Gros travaux / devis" : "Planifiée"}
      </div>
      <h1 className="text-2xl font-extrabold">{m.category?.name}</h1>
      <p className="text-muted">{STATUS_LABELS[m.status]}</p>
      <div className="mt-4 rounded-3xl border border-line p-4">
        <div className="font-bold">{money(m.total)}</div>
        <p>
          📍 {unlocked ? `${m.address}, ${m.city}` : `${m.city} · adresse après acceptation`}{" "}
          {m.pro ? `· ${km(m.pro.distanceKm)}` : ""}
        </p>
        <p className="mt-1 text-sm">{m.description}</p>
        <p className="mt-1 text-sm">
          Client :{" "}
          {unlocked
            ? `${m.client?.firstName} ${m.client?.lastName}`
            : `${m.client?.firstName ?? "Client"} · coordonnées masquées`}
        </p>
        {!unlocked ? (
          <p className="mt-2 flex items-start gap-2 rounded-xl bg-background px-3 py-2 text-xs text-muted">
            <Lock size={14} className="mt-0.5 shrink-0" />
            Téléphone, messages et adresse exacte restent confidentiels jusqu’à votre acceptation — pas de contact hors AppO.
          </p>
        ) : m.client?.phone ? (
          <p className="mt-1 text-sm text-muted">Tél. {m.client.phone}</p>
        ) : null}
      </div>

      {m.pendingNegotiatePrice != null ? (
        <div className="mt-4 rounded-3xl border border-appo/30 bg-appo/5 p-4">
          <div className="font-bold">Négociation AppO+</div>
          <p className="text-sm">
            Le client propose <b>{money(m.pendingNegotiatePrice)}</b>
            {m.pendingNegotiateNote ? ` — ${m.pendingNegotiateNote}` : ""}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="now" onClick={() => act("respondNegotiate", { accept: true })}>
              Accepter
            </Button>
            <Button variant="secondary" onClick={() => act("respondNegotiate", { accept: false })}>
              Refuser
            </Button>
          </div>
        </div>
      ) : null}

      {["accepted", "en_route", "arrived", "in_progress", "completed"].includes(m.status) ? (
        <div className="mt-4 rounded-3xl border border-line bg-card p-4">
          <div className="font-bold">Devis & facture</div>
          {m.quote ? (
            <div className="mt-2 text-sm">
              <div>
                Devis : <b>{m.quote.status}</b> · Total {money(m.quote.total)}
              </div>
              <ul className="mt-1 text-muted">
                {(m.quote.lines ?? []).map((l: any, i: number) => (
                  <li key={i}>
                    {l.label} — {money(l.amount)}
                  </li>
                ))}
              </ul>
            </div>
          ) : ["arrived", "in_progress"].includes(m.status) || m.isLargeWorks ? (
            <Button
              className="mt-3 w-full"
              variant="secondary"
              onClick={async () => {
                await api("/api/pro", {
                  action: "createQuote",
                  missionId: m.id,
                  lines: [
                    { label: m.category?.name ?? "Intervention", amount: m.price },
                    ...(m.supplement ? [{ label: "Supplément", amount: m.supplement }] : []),
                  ],
                });
                reload();
              }}
            >
              Envoyer un devis (gros travaux)
            </Button>
          ) : (
            <Button
              className="mt-3 w-full"
              variant="secondary"
              onClick={async () => {
                await api("/api/pro", {
                  action: "createQuote",
                  missionId: m.id,
                  lines: [
                    { label: m.category?.name ?? "Intervention", amount: m.price },
                    ...(m.supplement ? [{ label: "Supplément", amount: m.supplement }] : []),
                  ],
                });
                reload();
              }}
            >
              Envoyer un devis au client
            </Button>
          )}
          {m.invoice ? (
            <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-green">
              Facture {m.invoice.number} · {money(m.invoice.total)}
              {m.invoice.tip ? ` + pourboire ${money(m.invoice.tip)}` : ""} · {m.invoice.status === "paid" ? "payée" : "émise"}
            </div>
          ) : null}
        </div>
      ) : null}

      {unlocked && m.status !== "offered" && m.status !== "searching" ? (
        <div className="mt-4 rounded-3xl border border-line p-4">
          <div className="font-bold">Attribution équipe</div>
          <select
            className={inputClass + " mt-2"}
            value={m.assigneeMemberId ?? ""}
            onChange={async (e) => {
              await api("/api/pro", { action: "assignMission", missionId: m.id, memberId: e.target.value || null });
              reload();
            }}
          >
            <option value="">Non assigné</option>
            {(m.team ?? []).map((t: any) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="mt-4">
        <TrackingMap
          destination={{ lat: m.lat, lng: m.lng }}
          pro={m.live && unlocked ? { lat: m.live.lat, lng: m.live.lng } : null}
          etaMinutes={m.status === "en_route" ? m.live?.etaMinutes ?? m.etaMinutes : null}
          label={unlocked ? m.address : m.city}
          unlocked={unlocked || offered}
          source={m.live?.source}
        />
        {["accepted", "en_route"].includes(m.status) ? (
          <p className="mt-2 text-xs text-muted">
            {gpsOk
              ? "GPS actif — votre position est partagée avec le client."
              : gpsErr
                ? `GPS : ${gpsErr}`
                : "Activation du GPS…"}
          </p>
        ) : null}
      </div>
      {m.photos?.length ? (
        <div className="mt-4 flex gap-2 overflow-x-auto">
          {m.photos.map((src: string) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src} src={src} alt="" className="h-24 w-32 shrink-0 rounded-xl object-cover" />
          ))}
        </div>
      ) : null}

      {offered ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="now" onClick={() => act("accept")}>
            Accepter
          </Button>
          <Button variant="secondary" onClick={() => act("pass")}>
            Passer
          </Button>
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

      {unlocked ? (
        <div className="mt-6">
          <h2 className="font-bold">Messages</h2>
          <div className="mt-3 space-y-2">
            {(m.messages ?? []).map((msg: any) => (
              <div
                key={msg.id}
                className={`rounded-2xl px-3 py-2 text-sm ${msg.senderId !== m.clientId ? "ml-8 bg-ink text-white" : "mr-8 bg-background"}`}
              >
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
      ) : (
        <p className="mt-6 text-center text-sm text-muted">Messagerie disponible après acceptation.</p>
      )}
    </div>
  );
}

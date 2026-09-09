"use client";

import Link from "next/link";
import { useState } from "react";
import { api, usePoll } from "@/lib/hooks";
import { Badge, Button, inputClass } from "@/components/ui";

const STATUS: Record<string, string> = {
  open: "Ouvert",
  in_review: "En cours",
  resolved: "Résolu",
  closed: "Clos",
};

export default function AdminLitiges() {
  const { data, reload } = usePoll<any>("/api/admin", 4000);
  const [reply, setReply] = useState<Record<string, string>>({});
  const [resolution, setResolution] = useState<Record<string, string>>({});

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Support & litiges</h1>
      <p className="mt-1 text-sm text-muted">Tickets clients et litiges mission — réponses et résolution.</p>

      <h2 className="mt-8 text-lg font-bold">Litiges mission</h2>
      <div className="mt-3 space-y-3">
        {(data?.disputes ?? []).map((d: any) => (
          <div key={d.id} className="rounded-3xl border border-line bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-bold">
                  {d.mission?.categoryId ?? d.missionId} · {d.category}
                </div>
                <div className="text-sm text-muted">{d.reason}</div>
              </div>
              <Badge tone={d.status === "open" ? "orange" : d.status === "resolved" || d.status === "closed" ? "green" : "neutral"}>
                {STATUS[d.status] ?? d.status}
              </Badge>
            </div>
            <div className="mt-3 max-h-40 space-y-1 overflow-y-auto text-sm">
              {(d.messages ?? []).map((m: any) => (
                <div key={m.id} className="rounded-xl bg-background px-3 py-2">
                  <span className="text-xs font-bold uppercase text-muted">{m.role}</span> — {m.text}
                </div>
              ))}
            </div>
            {d.status === "open" || d.status === "in_review" ? (
              <div className="mt-3 space-y-2">
                <input
                  className={inputClass}
                  placeholder="Répondre…"
                  value={reply[d.id] ?? ""}
                  onChange={(e) => setReply({ ...reply, [d.id]: e.target.value })}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      if (!reply[d.id]?.trim()) return;
                      await api("/api/support", { action: "reply", id: d.id, text: reply[d.id], kind: "dispute" });
                      setReply({ ...reply, [d.id]: "" });
                      reload();
                    }}
                  >
                    Répondre
                  </Button>
                </div>
                <input
                  className={inputClass}
                  placeholder="Résolution finale…"
                  value={resolution[d.id] ?? ""}
                  onChange={(e) => setResolution({ ...resolution, [d.id]: e.target.value })}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={async () => {
                      await api("/api/admin", {
                        action: "resolveDispute",
                        id: d.id,
                        resolution: resolution[d.id] || "Litige résolu",
                      });
                      reload();
                    }}
                  >
                    Résoudre
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      await api("/api/admin", {
                        action: "resolveDispute",
                        id: d.id,
                        resolution: resolution[d.id] || "Remboursement accordé",
                        refund: true,
                      });
                      reload();
                    }}
                  >
                    Résoudre + remboursement
                  </Button>
                </div>
              </div>
            ) : d.resolution ? (
              <p className="mt-2 text-sm text-muted">Résolution : {d.resolution}</p>
            ) : null}
          </div>
        ))}
        {!data?.disputes?.length ? <p className="text-muted">Aucun litige.</p> : null}
      </div>

      <h2 className="mt-10 text-lg font-bold">Tickets support</h2>
      <div className="mt-3 space-y-3">
        {(data?.supportTickets ?? []).map((t: any) => (
          <div key={t.id} className="rounded-3xl border border-line bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-bold">{t.subject}</div>
                <div className="text-sm text-muted">{t.category}</div>
              </div>
              <Badge tone={t.status === "open" ? "orange" : t.status === "resolved" || t.status === "closed" ? "green" : "neutral"}>
                {STATUS[t.status] ?? t.status}
              </Badge>
            </div>
            <div className="mt-3 max-h-40 space-y-1 overflow-y-auto text-sm">
              {(t.messages ?? []).map((m: any) => (
                <div key={m.id} className="rounded-xl bg-background px-3 py-2">
                  <span className="text-xs font-bold uppercase text-muted">{m.role}</span> — {m.text}
                </div>
              ))}
            </div>
            {t.status === "open" || t.status === "in_review" ? (
              <div className="mt-3 space-y-2">
                <input
                  className={inputClass}
                  placeholder="Répondre…"
                  value={reply[t.id] ?? ""}
                  onChange={(e) => setReply({ ...reply, [t.id]: e.target.value })}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      if (!reply[t.id]?.trim()) return;
                      await api("/api/support", { action: "reply", id: t.id, text: reply[t.id], kind: "ticket" });
                      setReply({ ...reply, [t.id]: "" });
                      reload();
                    }}
                  >
                    Répondre
                  </Button>
                  <Button
                    onClick={async () => {
                      await api("/api/admin", {
                        action: "resolveTicket",
                        id: t.id,
                        resolution: reply[t.id] || "Ticket résolu",
                      });
                      setReply({ ...reply, [t.id]: "" });
                      reload();
                    }}
                  >
                    Clore
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        ))}
        {!data?.supportTickets?.length ? <p className="text-muted">Aucun ticket.</p> : null}
      </div>
      <p className="mt-6 text-xs text-muted">
        Les clients ouvrent un ticket depuis <Link className="text-appo" href="/app/support">/app/support</Link>.
      </p>
    </div>
  );
}

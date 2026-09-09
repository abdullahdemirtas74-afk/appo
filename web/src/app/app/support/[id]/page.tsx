"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Badge, Button, inputClass } from "@/components/ui";
import { api, usePoll } from "@/lib/hooks";
import { formatTime } from "@/lib/format";

const STATUS: Record<string, string> = {
  open: "Ouvert",
  in_review: "En cours",
  resolved: "Résolu",
  closed: "Clos",
};

export default function SupportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, reload } = usePoll<any>(id ? `/api/support?id=${id}` : null, 3000);
  const [text, setText] = useState("");
  const item = data?.item;
  if (!item) return <div className="p-6 text-muted">Chargement…</div>;

  const closed = item.status === "resolved" || item.status === "closed";

  return (
    <div className="px-5 py-6 pb-10">
      <Link href="/app/support" className="text-sm font-semibold text-appo">
        ← Retour
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-extrabold">
          {data.kind === "dispute" ? "Litige mission" : item.subject}
        </h1>
        <Badge tone={item.status === "open" ? "orange" : closed ? "green" : "neutral"}>
          {STATUS[item.status] ?? item.status}
        </Badge>
      </div>
      {data.kind === "dispute" && data.mission ? (
        <p className="mt-1 text-sm text-muted">
          Mission {data.mission.category?.name} · {data.mission.city} · catégorie {item.category}
        </p>
      ) : null}
      {item.resolution ? (
        <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm">
          <div className="font-bold text-green-800">Résolution</div>
          <p className="mt-1 text-green-900/80">{item.resolution}</p>
        </div>
      ) : null}

      <div className="mt-6 max-h-80 space-y-2 overflow-y-auto">
        {(item.messages ?? []).map((msg: any) => (
          <div
            key={msg.id}
            className={`rounded-2xl px-3 py-2 text-sm ${
              msg.role === "admin" ? "bg-ink text-white" : msg.role === "pro" ? "bg-background" : "ml-6 bg-appo text-white"
            }`}
          >
            <div className="text-[10px] font-bold uppercase opacity-70">{msg.role}</div>
            {msg.text}
            <div className="mt-1 text-[10px] opacity-70">{formatTime(msg.createdAt)}</div>
          </div>
        ))}
      </div>

      {!closed ? (
        <div className="mt-4 flex gap-2">
          <input className={inputClass} value={text} onChange={(e) => setText(e.target.value)} placeholder="Votre message…" />
          <Button
            onClick={async () => {
              if (!text.trim()) return;
              await api("/api/support", { action: "reply", id: item.id, text, kind: data.kind });
              setText("");
              reload();
            }}
          >
            Envoyer
          </Button>
        </div>
      ) : null}
    </div>
  );
}

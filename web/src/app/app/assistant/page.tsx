"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMe } from "@/components/guard";
import { Button, Field, inputClass } from "@/components/ui";
import { api } from "@/lib/hooks";
import { money } from "@/lib/format";

type Msg = { role: "assistant" | "user"; text: string };

export default function AssistantPage() {
  const router = useRouter();
  const { data: me } = useMe();
  const [text, setText] = useState("");
  const [history, setHistory] = useState<Msg[]>([
    { role: "assistant", text: "Bonjour, je suis l’assistant AppO. Décrivez votre problème (ex. « mon évier fuit »)." },
  ]);
  const [result, setResult] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const addr = me?.addresses?.find((a) => a.isDefault) ?? me?.addresses?.[0];

  async function send() {
    if (!text.trim()) return;
    const nextHistory = [...history, { role: "user" as const, text }];
    setHistory(nextHistory);
    setText("");
    setBusy(true);
    try {
      const res = await api<any>("/api/growth", { action: "assistant", text: nextHistory[nextHistory.length - 1].text, history: nextHistory });
      setResult(res);
      setHistory((h) => [...h, ...res.messages]);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function createMission(kind: "now" | "rfq") {
    if (!result?.categoryId) return;
    if (!addr?.line) {
      alert("Ajoutez une adresse dans Mon compte.");
      return;
    }
    setBusy(true);
    try {
      if (kind === "rfq") {
        const res = await api<{ request: { id: string } }>("/api/requests", {
          categoryId: result.categoryId,
          description: result.draftDescription,
          photos: [],
          address: addr.line,
          city: addr.city,
          lat: addr.lat,
          lng: addr.lng,
          availabilityNote: "Dès que possible",
        });
        router.push(`/app/demandes/${res.request.id}`);
      } else {
        const res = await api<{ mission: { id: string } }>("/api/missions", {
          type: result.urgency ? "urgence" : "now",
          categoryId: result.categoryId,
          description: result.draftDescription,
          photos: [],
          address: addr.line,
          city: addr.city,
          lat: addr.lat,
          lng: addr.lng,
        });
        router.push(`/app/missions/${res.mission.id}`);
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="px-5 py-6 pb-10">
      <h1 className="text-2xl font-extrabold">Assistant AppO</h1>
      <p className="mt-1 text-sm text-muted">Décrivez le besoin — l’assistant propose catégorie, prix et crée la demande.</p>
      <div className="mt-4 space-y-2 rounded-3xl border border-line bg-card p-4">
        {history.map((m, i) => (
          <div
            key={i}
            className={`rounded-2xl px-3 py-2 text-sm ${m.role === "assistant" ? "bg-background" : "ml-6 bg-ink text-white"}`}
          >
            {m.text}
          </div>
        ))}
      </div>
      {result?.estimatedPrice != null ? (
        <div className="mt-3 rounded-2xl border border-line px-4 py-3 text-sm">
          Estimation : <b>{money(result.estimatedPrice)}</b>
          {result.categoryName ? ` · ${result.categoryName}` : ""}
          {result.urgency ? " · Urgence" : ""}
        </div>
      ) : null}
      <div className="mt-4 flex gap-2">
        <input
          className={inputClass}
          value={text}
          placeholder="Ex. mon évier fuit"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <Button onClick={send} disabled={busy}>
          Envoyer
        </Button>
      </div>
      {result?.ready ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Button className="w-full" variant="now" disabled={busy} onClick={() => createMission("now")}>
            Lancer AppO Now
          </Button>
          <Button className="w-full" variant="secondary" disabled={busy} onClick={() => createMission("rfq")}>
            Comparer des devis
          </Button>
        </div>
      ) : null}
    </div>
  );
}

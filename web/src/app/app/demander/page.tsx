"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { Clock3, FileText, Zap } from "lucide-react";
import { useMe } from "@/components/guard";
import { Button, Field, inputClass } from "@/components/ui";
import { api, usePoll } from "@/lib/hooks";

type Mode = "now" | "plan" | "devis";

function DemanderInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { data: me } = useMe();
  const { data } = usePoll<{ categories: { id: string; name: string; emoji?: string; indicativePrice?: number }[] }>(
    "/api/categories",
    0,
  );
  const addr = me?.addresses?.find((a) => a.isDefault) ?? me?.addresses?.[0];
  const initialCategory = params.get("categoryId") || "";
  const initialMode = (params.get("mode") as Mode) || "now";
  const [step, setStep] = useState(() => {
    if (initialCategory && params.get("mode")) return 2;
    if (initialCategory) return 1;
    return 0;
  });
  const [mode, setMode] = useState<Mode>(initialMode);
  const [categoryId, setCategoryId] = useState(initialCategory);
  const [description, setDescription] = useState("");
  const [when, setWhen] = useState("");
  const [urgency, setUrgency] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const cats = data?.categories ?? [];
  const cat = cats.find((c) => c.id === categoryId);

  const modes = useMemo(
    () =>
      [
        {
          id: "now" as const,
          title: "Maintenant",
          body: "Un pro dispo tout de suite",
          icon: Zap,
        },
        {
          id: "plan" as const,
          title: "Sur rendez-vous",
          body: "Choisir un créneau et un pro",
          icon: Clock3,
        },
        {
          id: "devis" as const,
          title: "Comparer des devis",
          body: "Recevoir plusieurs offres",
          icon: FileText,
        },
      ] as const,
    [],
  );

  async function finish() {
    if (!categoryId) {
      setError("Choisissez un service");
      return;
    }
    if (!addr?.line) {
      setError("Indiquez votre adresse sur l’accueil avant de continuer");
      return;
    }
    setError("");
    setLoading(true);
    try {
      if (mode === "plan") {
        const q = new URLSearchParams({ categoryId });
        if (when) q.set("when", when);
        router.push(`/app/recherche?${q.toString()}`);
        return;
      }
      if (mode === "devis") {
        const res = await api<{ request: { id: string } }>("/api/requests", {
          categoryId,
          description: description.trim() || `Demande ${cat?.name ?? "service"}`,
          availabilityNote: when ? `Souhaité : ${when}` : "Dès que possible",
          preferredAt: when ? new Date(when).toISOString() : null,
          photos: [],
          address: addr.line,
          city: addr.city,
          lat: addr.lat,
          lng: addr.lng,
          isLargeWorks: params.get("large") === "1",
        });
        router.replace(`/app/demandes/${res.request.id}`);
        return;
      }
      const res = await api<{ mission: { id: string } }>("/api/missions", {
        type: urgency ? "urgence" : "now",
        categoryId,
        description: description.trim() || `Intervention ${cat?.name ?? ""}`.trim(),
        photos: [],
        address: addr.line,
        city: addr.city,
        lat: addr.lat,
        lng: addr.lng,
      });
      router.replace(`/app/missions/${res.mission.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6 sm:px-6 md:px-8">
      <button type="button" className="text-sm font-semibold text-appo" onClick={() => router.push("/app")}>
        ← Accueil
      </button>
      <h1 className="mt-3 text-2xl font-extrabold md:text-3xl">Demander un pro</h1>
      <p className="mt-1 text-sm text-muted">
        {addr ? `${addr.line}, ${addr.city}` : "Pensez à renseigner votre adresse sur l’accueil."}
      </p>

      <div className="mt-4 flex gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-appo" : "bg-line"}`}
          />
        ))}
      </div>

      {step === 0 ? (
        <div className="mt-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">1. Votre besoin</h2>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {cats.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setCategoryId(c.id);
                  setStep(1);
                }}
                className={`rounded-2xl border p-3 text-left transition ${
                  categoryId === c.id ? "border-appo bg-appo/5" : "border-line bg-card hover:border-appo/40"
                }`}
              >
                <div className="text-2xl">{c.emoji ?? "🔧"}</div>
                <div className="mt-1 text-sm font-semibold leading-tight">{c.name}</div>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="mt-6">
          <button type="button" className="text-sm font-semibold text-muted" onClick={() => setStep(0)}>
            ← {cat?.name ?? "Service"}
          </button>
          <h2 className="mt-3 text-sm font-bold uppercase tracking-wide text-muted">2. Quand ?</h2>
          <div className="mt-3 space-y-2">
            {modes.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setMode(m.id);
                    setStep(2);
                  }}
                  className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3.5 text-left transition ${
                    mode === m.id ? "border-appo bg-appo/5" : "border-line bg-card hover:border-appo/40"
                  }`}
                >
                  <span className="mt-0.5 grid h-10 w-10 place-items-center rounded-xl bg-ink text-white">
                    <Icon size={18} />
                  </span>
                  <span>
                    <span className="block font-bold">{m.title}</span>
                    <span className="text-sm text-muted">{m.body}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="mt-6 space-y-4">
          <button type="button" className="text-sm font-semibold text-muted" onClick={() => setStep(1)}>
            ← Quand
          </button>
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">3. Détails</h2>
          <p className="text-sm text-muted">
            {cat?.name} · {modes.find((m) => m.id === mode)?.title}
          </p>

          {mode === "now" ? (
            <button
              type="button"
              onClick={() => setUrgency((v) => !v)}
              className={`w-full rounded-2xl border px-4 py-3 text-left ${
                urgency ? "border-appo bg-orange-50" : "border-line bg-card"
              }`}
            >
              <div className="font-bold">⚡ Urgence</div>
              <div className="text-sm text-muted">Priorité pros dispo (tarif majoré)</div>
            </button>
          ) : null}

          {mode !== "now" ? (
            <Field label={mode === "plan" ? "Date et heure souhaitées" : "Disponibilités (optionnel)"}>
              <input
                className={inputClass}
                type={mode === "plan" ? "datetime-local" : "text"}
                value={when}
                onChange={(e) => setWhen(e.target.value)}
                placeholder="Ex. demain après-midi"
              />
            </Field>
          ) : null}

          <Field label="Décrivez le besoin (optionnel)">
            <textarea
              className={inputClass}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex. fuite sous l’évier, bruit anormal…"
            />
          </Field>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <Button variant="now" className="w-full" disabled={loading} onClick={() => void finish()}>
            {loading
              ? "Envoi…"
              : mode === "plan"
                ? "Voir les professionnels"
                : mode === "devis"
                  ? "Publier ma demande"
                  : "Trouver un pro maintenant"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export default function DemanderPage() {
  return (
    <Suspense>
      <DemanderInner />
    </Suspense>
  );
}

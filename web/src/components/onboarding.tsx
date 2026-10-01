"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, ChevronRight } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui";
import { api } from "@/lib/hooks";
import { CLIENT_ONBOARDING, PRO_ONBOARDING, type OnboardingStep } from "@/lib/onboarding";

export function OnboardingWizard({ role }: { role: "client" | "pro" }) {
  const router = useRouter();
  const steps: OnboardingStep[] = role === "pro" ? PRO_ONBOARDING : CLIENT_ONBOARDING;
  const home = role === "pro" ? "/pro" : "/app";
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const step = steps[index];
  const last = index >= steps.length - 1;
  const progress = ((index + 1) / steps.length) * 100;

  async function finish() {
    setBusy(true);
    try {
      await api("/api/me", { action: "completeOnboarding" });
      router.replace(home);
    } catch {
      router.replace(home);
    } finally {
      setBusy(false);
    }
  }

  async function skip() {
    await finish();
  }

  function next() {
    if (last) void finish();
    else setIndex((i) => i + 1);
  }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[radial-gradient(ellipse_at_top,_#ffe8df_0%,_#f7f7f5_45%,_#f0f0ee_100%)]">
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-5 py-6 sm:px-8 sm:py-10">
        <div className="flex items-center justify-between gap-3">
          <Logo size="sm" />
          <button
            type="button"
            className="text-sm font-semibold text-muted hover:text-ink"
            onClick={() => void skip()}
            disabled={busy}
          >
            Passer
          </button>
        </div>

        <div className="mt-8 h-1.5 overflow-hidden rounded-full bg-white/80">
          <div
            className="h-full rounded-full bg-appo transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Étape {index + 1} / {steps.length}
        </p>

        <div className="mt-8 flex flex-1 flex-col">
          <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_20px_50px_rgba(20,20,20,0.06)] backdrop-blur sm:p-8">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-appo/10 text-appo">
              {last ? <Check size={22} strokeWidth={2.5} /> : <ChevronRight size={22} strokeWidth={2.5} />}
            </div>
            <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-ink">{step.title}</h1>
            <p className="mt-3 text-base leading-relaxed text-muted">{step.body}</p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                variant="now"
                className="w-full sm:flex-1"
                disabled={busy}
                onClick={() => next()}
              >
                {last ? (busy ? "Enregistrement…" : "Terminer") : "Continuer"}
              </Button>
              <Button
                variant="secondary"
                className="w-full sm:flex-1"
                href={step.href}
                onClick={() => {
                  /* keep onboarding incomplete so they can return; mark step locally */
                }}
              >
                {step.ctaLabel}
              </Button>
            </div>
          </div>

          <div className="mt-6 flex justify-center gap-2">
            {steps.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={`Étape ${i + 1}`}
                className={`h-2.5 rounded-full transition-all ${
                  i === index ? "w-8 bg-appo" : i < index ? "w-2.5 bg-appo/40" : "w-2.5 bg-ink/15"
                }`}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>

          <p className="mt-auto pt-10 text-center text-xs text-muted">
            Vous pourrez revoir ce guide depuis votre compte.
          </p>
        </div>
      </div>
    </div>
  );
}

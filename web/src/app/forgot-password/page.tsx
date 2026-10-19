"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/logo";
import { AuthShell } from "@/components/shell";
import { Button, Field, inputClass } from "@/components/ui";
import { api } from "@/lib/hooks";

function ForgotForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [step, setStep] = useState<"verify" | "password">("verify");
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [phone, setPhone] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function verifyIdentity(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api<{ ok: boolean; resetToken?: string }>("/api/auth/forgot-password", {
        email,
        phone,
      });
      if (!res.resetToken) {
        setError("Impossible de poursuivre — réessayez");
        return;
      }
      setResetToken(res.resetToken);
      setStep("password");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur";
      setError(
        msg === "EMAIL_REQUIRED"
          ? "Indiquez un e-mail valide"
          : msg === "PHONE_REQUIRED"
            ? "Indiquez le téléphone du compte"
            : msg === "RESET_IDENTITY_INVALID"
              ? "E-mail ou téléphone incorrect"
              : msg === "RATE_LIMITED"
                ? "Trop de tentatives — réessayez dans quelques minutes"
                : msg,
      );
    } finally {
      setLoading(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Mot de passe : 8 caractères minimum");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api("/api/auth/reset-password", { token: resetToken, password });
      setDone(true);
      setTimeout(() => router.replace("/login"), 1600);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur";
      setError(
        msg === "RESET_TOKEN_INVALID"
          ? "Session expirée — recommencez"
          : msg === "RESET_TOKEN_EXPIRED"
            ? "Délai dépassé (15 min) — recommencez"
            : msg === "PASSWORD_TOO_SHORT"
              ? "Mot de passe : 8 caractères minimum"
              : msg === "RATE_LIMITED"
                ? "Trop de tentatives — réessayez plus tard"
                : msg,
      );
      if (msg === "RESET_TOKEN_INVALID" || msg === "RESET_TOKEN_EXPIRED") {
        setStep("verify");
        setResetToken("");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <div className="lg:hidden">
        <Logo />
      </div>
      <h1 className="mt-8 text-3xl font-extrabold lg:mt-0">Mot de passe oublié</h1>
      <p className="mt-2 text-muted">
        {step === "verify"
          ? "Réinitialisez votre mot de passe directement sur AppO avec l’e-mail et le téléphone du compte."
          : "Choisissez un nouveau mot de passe (8 caractères minimum)."}
      </p>

      {done ? (
        <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          Mot de passe mis à jour. Redirection vers la connexion…
        </div>
      ) : step === "verify" ? (
        <form onSubmit={verifyIdentity} className="mt-8 space-y-4">
          <Field label="E-mail du compte">
            <input
              className={inputClass}
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Téléphone du compte">
            <input
              className={inputClass}
              type="tel"
              required
              autoComplete="tel"
              placeholder="06…"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Field>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" variant="now" className="w-full" disabled={loading}>
            {loading ? "Vérification…" : "Continuer"}
          </Button>
        </form>
      ) : (
        <form onSubmit={savePassword} className="mt-8 space-y-4">
          <p className="rounded-2xl border border-line bg-white/60 px-3 py-2 text-sm text-muted">
            Compte : <span className="font-semibold text-ink">{email}</span>
          </p>
          <Field label="Nouveau mot de passe">
            <input
              className={inputClass}
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Field label="Confirmer">
            <input
              className={inputClass}
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </Field>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" variant="now" className="w-full" disabled={loading}>
            {loading ? "Enregistrement…" : "Enregistrer le mot de passe"}
          </Button>
          <button
            type="button"
            className="w-full text-sm font-semibold text-appo"
            onClick={() => {
              setStep("verify");
              setResetToken("");
              setPassword("");
              setConfirm("");
              setError("");
            }}
          >
            ← Modifier e-mail / téléphone
          </button>
        </form>
      )}

      <p className="mt-6 text-sm text-muted">
        <a className="font-semibold text-appo" href="/login">
          Retour à la connexion
        </a>
      </p>
    </AuthShell>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotForm />
    </Suspense>
  );
}

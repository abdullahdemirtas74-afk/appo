"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/logo";
import { AuthShell } from "@/components/shell";
import { Button, Field, inputClass } from "@/components/ui";
import { api } from "@/lib/hooks";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setError("Lien invalide ou incomplet");
      return;
    }
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
      await api("/api/auth/reset-password", { token, password });
      setDone(true);
      setTimeout(() => router.replace("/login"), 1800);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur";
      setError(
        msg === "RESET_TOKEN_INVALID"
          ? "Lien invalide ou déjà utilisé"
          : msg === "RESET_TOKEN_EXPIRED"
            ? "Lien expiré — demandez un nouveau lien"
            : msg === "PASSWORD_TOO_SHORT"
              ? "Mot de passe : 8 caractères minimum"
              : msg === "RATE_LIMITED"
                ? "Trop de tentatives — réessayez plus tard"
                : msg,
      );
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <AuthShell>
        <h1 className="mt-8 text-3xl font-extrabold lg:mt-0">Lien invalide</h1>
        <p className="mt-2 text-muted">Ce lien de réinitialisation est incomplet.</p>
        <p className="mt-6">
          <a className="font-semibold text-appo" href="/forgot-password">
            Demander un nouveau lien
          </a>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="lg:hidden">
        <Logo />
      </div>
      <h1 className="mt-8 text-3xl font-extrabold lg:mt-0">Nouveau mot de passe</h1>
      <p className="mt-2 text-muted">Choisissez un mot de passe d’au moins 8 caractères.</p>

      {done ? (
        <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          Mot de passe mis à jour. Redirection vers la connexion…
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-4">
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
        </form>
      )}
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}

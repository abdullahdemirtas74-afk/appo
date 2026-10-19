"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Logo } from "@/components/logo";
import { AuthShell } from "@/components/shell";
import { Button, Field, inputClass } from "@/components/ui";
import { api } from "@/lib/hooks";

function ForgotForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api("/api/auth/forgot-password", { email });
      setDone(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur";
      setError(
        msg === "EMAIL_REQUIRED"
          ? "Indiquez un e-mail valide"
          : msg === "RATE_LIMITED"
            ? "Trop de tentatives — réessayez dans quelques minutes"
            : msg,
      );
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
        Indiquez l’e-mail de votre compte. Si un compte existe, vous recevrez un lien de
        réinitialisation (valable 1 heure).
      </p>

      {done ? (
        <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          Si un compte existe pour <b>{email}</b>, un e-mail vient d’être envoyé. Pensez à vérifier
          vos spams.
          <div className="mt-4">
            <a className="font-semibold text-appo" href="/login">
              Retour à la connexion
            </a>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-4">
          <Field label="E-mail">
            <input
              className={inputClass}
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" variant="now" className="w-full" disabled={loading}>
            {loading ? "Envoi…" : "Envoyer le lien"}
          </Button>
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

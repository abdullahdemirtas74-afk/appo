"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Logo } from "@/components/logo";
import { Button, Field, inputClass } from "@/components/ui";
import { api } from "@/lib/hooks";
import { DEMO_ACCOUNTS } from "@/lib/demo";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get("email") ?? "sarah@appo.fr");
  const [password, setPassword] = useState("appo123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api<{ user: { role: string } }>("/api/auth/login", { email, password });
      router.replace(res.user.role === "admin" ? "/admin" : res.user.role === "pro" ? "/pro" : "/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="phone-app flex min-h-dvh flex-col px-6 py-8">
      <Logo />
      <h1 className="mt-10 text-3xl font-extrabold">Connexion</h1>
      <p className="mt-2 text-muted">Particulier, Pro ou Admin — un seul espace d’entrée.</p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <Field label="E-mail">
          <input className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </Field>
        <Field label="Mot de passe">
          <input className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </Field>
        {error ? <p className="text-sm text-red-600">{error === "INVALID_CREDENTIALS" ? "Identifiants incorrects" : error}</p> : null}
        <Button type="submit" variant="now" className="w-full" disabled={loading}>
          {loading ? "Connexion…" : "Se connecter"}
        </Button>
      </form>
      <p className="mt-6 text-sm text-muted">
        Pas encore de compte ? <a className="font-semibold text-appo" href="/register">Créer un compte</a>
      </p>
      <div className="mt-8 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Comptes démo</p>
        {DEMO_ACCOUNTS.map((a) => (
          <button
            key={a.email}
            className="flex w-full items-center justify-between rounded-2xl border border-line px-4 py-3 text-left text-sm"
            onClick={() => {
              setEmail(a.email);
              setPassword(a.password);
            }}
          >
            <span>
              <span className="font-semibold">{a.name}</span>
              <span className="block text-xs text-muted">{a.email}</span>
            </span>
            <span className="text-xs font-semibold text-appo">{a.role}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import { AuthShell } from "@/components/shell";
import { Button, Field, inputClass } from "@/components/ui";
import { api, usePoll } from "@/lib/hooks";
import { RUMILLY } from "@/lib/geo";
import type { ClientKind } from "@/lib/types";

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [role, setRole] = useState<"client" | "pro">(params.get("role") === "pro" ? "pro" : "client");
  const [clientKind, setClientKind] = useState<ClientKind>(
    params.get("kind") === "entreprise" || params.get("kind") === "syndicat"
      ? (params.get("kind") as ClientKind)
      : "particulier",
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { data } = usePoll<{ categories: { id: string; name: string }[] }>("/api/categories", 0);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "appo123",
    company: "",
    siret: "",
    organizationName: "",
    organizationSiret: "",
    categoryId: "cat_plomberie",
    radiusKm: 25,
    startingPrice: 59,
    description: "",
  });

  useEffect(() => {
    if (params.get("role") === "pro") setRole("pro");
  }, [params]);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const body =
        role === "pro"
          ? {
              role: "pro",
              ...form,
              categoryIds: [form.categoryId],
              city: RUMILLY.city,
              lat: RUMILLY.lat,
              lng: RUMILLY.lng,
            }
          : {
              role: "client",
              firstName: form.firstName,
              lastName: form.lastName,
              email: form.email,
              phone: form.phone,
              password: form.password,
              clientKind,
              organizationName: form.organizationName,
              organizationSiret: form.organizationSiret,
              address: {
                line: "12 rue de la République",
                city: RUMILLY.city,
                zip: "74150",
                lat: RUMILLY.lat,
                lng: RUMILLY.lng,
              },
            };
      const res = await api<{ user: { role: string } }>("/api/auth/register", body);
      router.replace(res.user.role === "pro" ? "/pro" : "/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <div className="lg:hidden">
        <Logo />
      </div>
      <h1 className="mt-8 text-3xl font-extrabold lg:mt-0">Créer un compte</h1>
      <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-background p-1">
        <button
          type="button"
          className={`rounded-xl py-2 text-sm font-semibold ${role === "client" ? "bg-white shadow" : "text-muted"}`}
          onClick={() => setRole("client")}
        >
          Client
        </button>
        <button
          type="button"
          className={`rounded-xl py-2 text-sm font-semibold ${role === "pro" ? "bg-white shadow" : "text-muted"}`}
          onClick={() => setRole("pro")}
        >
          AppO Pro
        </button>
      </div>
      {role === "client" ? (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {(
            [
              ["particulier", "Particulier"],
              ["entreprise", "Entreprise"],
              ["syndicat", "Syndicat"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setClientKind(k)}
              className={`rounded-xl border py-2 text-xs font-semibold sm:text-sm ${
                clientKind === k ? "border-appo bg-appo/5 text-appo" : "border-line text-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}
      <form onSubmit={submit} className="mt-6 space-y-3 pb-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Prénom">
            <input className={inputClass} required value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
          </Field>
          <Field label="Nom">
            <input className={inputClass} required value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
          </Field>
        </div>
        <Field label="E-mail">
          <input className={inputClass} type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label="Téléphone">
          <input className={inputClass} required value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </Field>
        <Field label="Mot de passe">
          <input className={inputClass} type="password" required value={form.password} onChange={(e) => set("password", e.target.value)} />
        </Field>
        {role === "client" && clientKind !== "particulier" ? (
          <>
            <Field label={clientKind === "syndicat" ? "Nom du syndicat / copropriété" : "Nom de l’entreprise"}>
              <input
                className={inputClass}
                required
                value={form.organizationName}
                onChange={(e) => set("organizationName", e.target.value)}
              />
            </Field>
            <Field label="SIRET (optionnel)">
              <input className={inputClass} value={form.organizationSiret} onChange={(e) => set("organizationSiret", e.target.value)} />
            </Field>
          </>
        ) : null}
        {role === "pro" ? (
          <>
            <Field label="Entreprise">
              <input className={inputClass} required value={form.company} onChange={(e) => set("company", e.target.value)} />
            </Field>
            <Field label="SIRET">
              <input className={inputClass} required value={form.siret} onChange={(e) => set("siret", e.target.value)} />
            </Field>
            <Field label="Métier">
              <select className={inputClass} value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
                {(data?.categories ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Rayon d’intervention (km)">
                <input className={inputClass} type="number" value={form.radiusKm} onChange={(e) => set("radiusKm", Number(e.target.value))} />
              </Field>
              <Field label="Prix de départ (€)">
                <input className={inputClass} type="number" value={form.startingPrice} onChange={(e) => set("startingPrice", Number(e.target.value))} />
              </Field>
            </div>
            <Field label="Description">
              <textarea className={inputClass} rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
            </Field>
            <p className="text-xs text-muted">
              Documents (identité, Kbis, RC Pro) : simulés et envoyés pour validation admin.
            </p>
          </>
        ) : null}
        {error ? (
          <p className="text-sm text-red-600">
            {error === "EMAIL_TAKEN" ? "Cet e-mail existe déjà" : error === "ORG_REQUIRED" ? "Indiquez le nom de l’organisation" : error}
          </p>
        ) : null}
        <Button type="submit" variant="now" className="w-full" disabled={loading}>
          {loading
            ? "Création…"
            : role === "pro"
              ? "Créer mon compte Pro"
              : clientKind === "entreprise"
                ? "Créer mon compte Entreprise"
                : clientKind === "syndicat"
                  ? "Créer mon compte Syndicat"
                  : "Créer mon compte"}
        </Button>
        <p className="text-center text-sm text-muted">
          Déjà inscrit ?{" "}
          <a className="font-semibold text-appo" href="/login">
            Se connecter
          </a>
        </p>
      </form>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}

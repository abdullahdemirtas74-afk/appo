"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { AddressInput, type AddressValue } from "@/components/address-input";
import { Logo } from "@/components/logo";
import { AuthShell } from "@/components/shell";
import { Button, Field, inputClass } from "@/components/ui";
import { api, usePoll } from "@/lib/hooks";
import { nearestCity, SERVICE_CITIES } from "@/lib/cities";
import type { ClientKind } from "@/lib/types";

const ERROR_LABEL: Record<string, string> = {
  EMAIL_TAKEN: "Cet e-mail existe déjà",
  ORG_REQUIRED: "Indiquez le nom de l’organisation",
  PRIVACY_CONSENT_REQUIRED: "Acceptez la politique de confidentialité pour continuer",
  NAME_REQUIRED: "Indiquez votre prénom et votre nom",
  EMAIL_REQUIRED: "Indiquez un e-mail valide",
  PHONE_REQUIRED: "Indiquez un numéro de téléphone valide (ex. 06 12 34 56 78)",
  PASSWORD_TOO_SHORT: "Mot de passe : 8 caractères minimum",
  ADDRESS_REQUIRED: "Choisissez une adresse GPS (suggestion ou bouton GPS)",
  CITY_UNSUPPORTED: "Choisissez une ville desservie par AppO",
  COMPANY_REQUIRED: "Indiquez le nom de l’entreprise",
  SIRET_REQUIRED: "Indiquez un SIRET valide",
};

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [role, setRole] = useState<"client" | "pro">(params.get("role") === "pro" ? "pro" : "client");
  const [clientKind, setClientKind] = useState<ClientKind>(
    params.get("kind") === "entreprise" || params.get("kind") === "syndicat"
      ? (params.get("kind") as ClientKind)
      : "particulier",
  );
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { data } = usePoll<{ categories: { id: string; name: string }[] }>("/api/categories", 0);
  const categories = data?.categories ?? [];

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    company: "",
    siret: "",
    organizationName: "",
    organizationSiret: "",
    categoryId: "",
    radiusKm: 25,
    startingPrice: 59,
    description: "",
    addressLine: "",
    cityId: "",
    zip: "",
    lat: null as number | null,
    lng: null as number | null,
  });
  const [clientAddress, setClientAddress] = useState<AddressValue | null>(null);

  useEffect(() => {
    if (params.get("role") === "pro") setRole("pro");
  }, [params]);

  useEffect(() => {
    if (!form.categoryId && categories.length > 0) {
      setForm((f) => ({ ...f, categoryId: categories[0].id }));
    }
  }, [categories, form.categoryId]);

  const selectedCity = useMemo(
    () => SERVICE_CITIES.find((c) => c.id === form.cityId) ?? null,
    [form.cityId],
  );

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function onCityChange(cityId: string) {
    const city = SERVICE_CITIES.find((c) => c.id === cityId);
    setForm((f) => ({
      ...f,
      cityId,
      zip: city?.zipHint && (!f.zip || f.zip === selectedCity?.zipHint) ? city.zipHint : f.zip || city?.zipHint || "",
    }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!privacyConsent) {
      setError("PRIVACY_CONSENT_REQUIRED");
      return;
    }
    if (role === "pro" && (!form.cityId || !selectedCity)) {
      setError("CITY_UNSUPPORTED");
      return;
    }
    if (
      role === "client" &&
      (!clientAddress?.line || !Number.isFinite(clientAddress.lat) || !Number.isFinite(clientAddress.lng))
    ) {
      setError("ADDRESS_REQUIRED");
      return;
    }
    if (form.password.length < 8) {
      setError("PASSWORD_TOO_SHORT");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const body =
        role === "pro"
          ? (() => {
              if (!selectedCity) throw new Error("CITY_UNSUPPORTED");
              return {
                role: "pro" as const,
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                password: form.password,
                company: form.company.trim(),
                siret: form.siret.trim(),
                categoryIds: [form.categoryId],
                radiusKm: form.radiusKm,
                startingPrice: form.startingPrice,
                description: form.description.trim(),
                city: selectedCity.name,
                lat: selectedCity.lat,
                lng: selectedCity.lng,
                privacyConsent: true,
              };
            })()
          : (() => {
              const addr = clientAddress!;
              const service = nearestCity(addr.lat, addr.lng);
              return {
                role: "client" as const,
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                password: form.password,
                clientKind,
                organizationName: form.organizationName.trim(),
                organizationSiret: form.organizationSiret.trim(),
                privacyConsent: true,
                address: {
                  line: addr.line.trim(),
                  city: addr.city || service.name,
                  zip: addr.zip.trim() || service.zipHint || "",
                  lat: addr.lat,
                  lng: addr.lng,
                  label:
                    clientKind === "syndicat"
                      ? "Copropriété"
                      : clientKind === "entreprise"
                        ? "Siège"
                        : "Domicile",
                },
              };
            })();

      const res = await api<{ user: { role: string } }>("/api/auth/register", body);
      router.replace(res.user.role === "pro" ? "/pro/onboarding" : "/app/onboarding");
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
      <p className="mt-2 text-sm text-muted">
        Renseignez vos informations complètes pour être opérationnel immédiatement.
      </p>
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
            <input
              className={inputClass}
              required
              autoComplete="given-name"
              value={form.firstName}
              onChange={(e) => set("firstName", e.target.value)}
            />
          </Field>
          <Field label="Nom">
            <input
              className={inputClass}
              required
              autoComplete="family-name"
              value={form.lastName}
              onChange={(e) => set("lastName", e.target.value)}
            />
          </Field>
        </div>
        <Field label="E-mail">
          <input
            className={inputClass}
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </Field>
        <Field label="Téléphone">
          <input
            className={inputClass}
            type="tel"
            required
            autoComplete="tel"
            inputMode="tel"
            placeholder="06 12 34 56 78"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
        </Field>
        <Field label="Mot de passe (8 caractères min.)">
          <input
            className={inputClass}
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
          />
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
              <input
                className={inputClass}
                value={form.organizationSiret}
                onChange={(e) => set("organizationSiret", e.target.value)}
              />
            </Field>
          </>
        ) : null}

        {role === "client" ? (
          <div className="space-y-3 rounded-2xl border border-line bg-background/50 p-3">
            <div className="text-sm font-semibold">Adresse d’intervention</div>
            <p className="text-xs text-muted">Recherche OpenStreetMap ou position GPS — coordonnées exactes.</p>
            <AddressInput
              required
              value={clientAddress}
              onChange={(addr) => {
                setClientAddress(addr);
                const service = nearestCity(addr.lat, addr.lng);
                setForm((f) => ({
                  ...f,
                  addressLine: addr.line,
                  cityId: service.id,
                  zip: addr.zip || service.zipHint || "",
                  lat: addr.lat,
                  lng: addr.lng,
                }));
              }}
              placeholder="Ex. 12 rue de la République, Rumilly"
            />
          </div>
        ) : null}

        {role === "pro" ? (
          <>
            <Field label="Entreprise">
              <input
                className={inputClass}
                required
                value={form.company}
                onChange={(e) => set("company", e.target.value)}
              />
            </Field>
            <Field label="SIRET">
              <input className={inputClass} required value={form.siret} onChange={(e) => set("siret", e.target.value)} />
            </Field>
            <Field label="Ville d’intervention">
              <select
                className={inputClass}
                required
                value={form.cityId}
                onChange={(e) => onCityChange(e.target.value)}
              >
                <option value="">Choisir une ville…</option>
                {SERVICE_CITIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Métier">
              <select
                className={inputClass}
                required
                value={form.categoryId}
                onChange={(e) => set("categoryId", e.target.value)}
              >
                {categories.length === 0 ? <option value="">Chargement…</option> : null}
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Rayon d’intervention (km)">
                <input
                  className={inputClass}
                  type="number"
                  min={1}
                  max={100}
                  required
                  value={form.radiusKm}
                  onChange={(e) => set("radiusKm", Number(e.target.value))}
                />
              </Field>
              <Field label="Prix de départ (€)">
                <input
                  className={inputClass}
                  type="number"
                  min={1}
                  required
                  value={form.startingPrice}
                  onChange={(e) => set("startingPrice", Number(e.target.value))}
                />
              </Field>
            </div>
            <Field label="Description">
              <textarea
                className={inputClass}
                rows={3}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </Field>
            <p className="text-xs text-muted">
              Après inscription, déposez vos documents (identité, Kbis, RC Pro) pour validation AppO.
            </p>
          </>
        ) : null}

        <label className="flex items-start gap-3 rounded-2xl border border-line bg-background/60 px-3 py-3 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={privacyConsent}
            onChange={(e) => setPrivacyConsent(e.target.checked)}
          />
          <span>
            J’accepte les{" "}
            <a className="font-semibold text-appo underline" href="/cgu" target="_blank" rel="noreferrer">
              CGU
            </a>
            , la{" "}
            <a className="font-semibold text-appo underline" href="/confidentialite" target="_blank" rel="noreferrer">
              politique de confidentialité
            </a>{" "}
            et la{" "}
            <a className="font-semibold text-appo underline" href="/remboursement" target="_blank" rel="noreferrer">
              politique d’annulation & remboursements
            </a>
            .
          </span>
        </label>
        {error ? <p className="text-sm text-red-600">{ERROR_LABEL[error] || error}</p> : null}
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

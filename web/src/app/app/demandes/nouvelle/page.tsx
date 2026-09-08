"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useMe } from "@/components/guard";
import { Button, Field, inputClass } from "@/components/ui";
import { api, fileToDataUrl, usePoll } from "@/lib/hooks";
import type { ClientKind } from "@/lib/types";

function PublierDemandeForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { data: me, reload: refreshMe } = useMe();
  const { data } = usePoll<{ categories: { id: string; name: string }[] }>("/api/categories", 0);
  const addr = me?.addresses?.find((a) => a.isDefault);
  const kindParam = params.get("kind");
  const large = params.get("large") === "1";
  const targetKind: ClientKind | null =
    kindParam === "entreprise" || kindParam === "syndicat" ? kindParam : null;

  const [categoryId, setCategoryId] = useState("cat_plomberie");
  const [description, setDescription] = useState(
    large
      ? "Gros travaux : décrire le projet, surfaces, contraintes d’accès…"
      : "Besoin de remplacer un robinet demain",
  );
  const [availabilityNote, setAvailabilityNote] = useState("Demain après-midi ou ce week-end");
  const [preferredAt, setPreferredAt] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [organizationName, setOrganizationName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (me?.user?.organizationName) setOrganizationName(me.user.organizationName);
  }, [me?.user?.organizationName]);

  const needsOrgSetup =
    targetKind &&
    (me?.user?.clientKind !== targetKind || !me?.user?.organizationName);

  async function ensureOrgProfile() {
    if (!targetKind) return;
    if (!organizationName.trim()) throw new Error("ORG_REQUIRED");
    await api("/api/me", {
      clientKind: targetKind,
      organizationName: organizationName.trim(),
    });
    await refreshMe();
  }

  async function submit() {
    setLoading(true);
    try {
      if (targetKind) await ensureOrgProfile();
      const res = await api<{ request: { id: string } }>("/api/requests", {
        categoryId,
        description,
        availabilityNote,
        preferredAt: preferredAt ? new Date(preferredAt).toISOString() : null,
        photos,
        address: addr?.line ?? "12 rue de la République",
        city: addr?.city ?? "Annecy",
        lat: addr?.lat ?? 45.899,
        lng: addr?.lng ?? 6.129,
      });
      router.replace(`/app/demandes/${res.request.id}`);
    } catch (e) {
      if (e instanceof Error && e.message === "ORG_REQUIRED") {
        alert("Indiquez le nom de votre organisation");
      }
    } finally {
      setLoading(false);
    }
  }

  const title =
    targetKind === "entreprise"
      ? "Besoin entreprise"
      : targetKind === "syndicat"
        ? "Besoin syndicat"
        : large
          ? "Devis · gros travaux"
          : "Publier un besoin";

  return (
    <div className="px-4 py-5 sm:px-6 md:px-8 md:py-8">
      <h1 className="text-2xl font-extrabold md:text-3xl">{title}</h1>
      <p className="mt-1 text-sm text-muted">
        {targetKind === "entreprise"
          ? "Publiez un besoin pour vos locaux ou votre activité — les pros vous envoient des offres."
          : targetKind === "syndicat"
            ? "Publiez un besoin pour la copropriété (parties communes, urgences, entretien)."
            : large
              ? "Pour les projets importants : les pros envoient des devis détaillés. Vous comparez puis choisissez."
              : "Les pros envoient des offres. Vous comparez prix, délais et notes — puis vous choisissez."}
      </p>
      {needsOrgSetup ? (
        <div className="mt-4 max-w-xl rounded-2xl border border-line bg-card p-4">
          <p className="text-sm font-semibold">
            {targetKind === "syndicat" ? "Identifiez votre syndicat" : "Identifiez votre entreprise"}
          </p>
          <Field label={targetKind === "syndicat" ? "Nom du syndicat / copropriété" : "Nom de l’entreprise"}>
            <input
              className={inputClass}
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder={targetKind === "syndicat" ? "Ex. Syndic Les Alpes" : "Ex. Dupont & Fils"}
            />
          </Field>
          <p className="mt-2 text-xs text-muted">
            Vous pourrez aussi modifier ça dans{" "}
            <Link href={`/app/compte?kind=${targetKind}`} className="font-semibold text-appo">
              Mon compte
            </Link>
            .
          </p>
        </div>
      ) : me?.user?.organizationName ? (
        <p className="mt-3 text-sm font-semibold text-appo">
          {(me.user.clientKind === "syndicat" ? "Syndicat" : me.user.clientKind === "entreprise" ? "Entreprise" : "") +
            (me.user.organizationName ? ` · ${me.user.organizationName}` : "")}
        </p>
      ) : null}
      <div className="mt-6 max-w-xl space-y-4">
        <Field label="Service">
          <select className={inputClass} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {(data?.categories ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Décrivez votre besoin">
          <textarea
            className={inputClass}
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex. Remplacer un robinet demain à Annecy…"
          />
        </Field>
        <Field label="Vos disponibilités">
          <input
            className={inputClass}
            value={availabilityNote}
            onChange={(e) => setAvailabilityNote(e.target.value)}
            placeholder="Demain 14h–18h, ou samedi matin"
          />
        </Field>
        <Field label="Créneau souhaité (optionnel)">
          <input
            className={inputClass}
            type="datetime-local"
            value={preferredAt}
            onChange={(e) => setPreferredAt(e.target.value)}
          />
        </Field>
        <Field label="Adresse">
          <input className={inputClass} readOnly value={addr ? `${addr.line}, ${addr.city}` : "Annecy"} />
        </Field>
        <Field label="Photos">
          <input
            type="file"
            accept="image/*"
            className="text-sm"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setPhotos([await fileToDataUrl(f)]);
            }}
          />
        </Field>
        {photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photos[0]} alt="" className="h-28 rounded-xl object-cover" />
        ) : null}
        <Button variant="now" className="w-full" disabled={loading || !description.trim()} onClick={submit}>
          {loading ? "Publication…" : "Recevoir des offres"}
        </Button>
        <p className="text-xs text-muted">
          AppO Prime reçoit la demande quelques minutes avant — les Pros gratuits peuvent aussi répondre ensuite.
        </p>
      </div>
    </div>
  );
}

export default function PublierDemandePage() {
  return (
    <Suspense>
      <PublierDemandeForm />
    </Suspense>
  );
}

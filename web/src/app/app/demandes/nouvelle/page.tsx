"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useMe } from "@/components/guard";
import { Button, Field, inputClass } from "@/components/ui";
import { api, fileToDataUrl, usePoll } from "@/lib/hooks";

function PublierDemandeForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { data: me } = useMe();
  const { data } = usePoll<{ categories: { id: string; name: string }[] }>("/api/categories", 0);
  const addrDefault = me?.addresses?.find((a) => a.isDefault);
  const [addressId, setAddressId] = useState("");
  const addresses = me?.addresses ?? [];
  const addr = addresses.find((a) => a.id === addressId) ?? addrDefault ?? addresses[0];
  const large = params.get("large") === "1";

  const [categoryId, setCategoryId] = useState("cat_plomberie");
  const [description, setDescription] = useState(
    large
      ? "Gros travaux : décrire le projet, surfaces, contraintes d’accès…"
      : "Besoin de remplacer un robinet demain",
  );
  const [availabilityNote, setAvailabilityNote] = useState("Demain après-midi ou ce week-end");
  const [preferredAt, setPreferredAt] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
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
        isLargeWorks: large,
      });
      router.replace(`/app/demandes/${res.request.id}`);
    } finally {
      setLoading(false);
    }
  }

  const orgLabel =
    me?.user?.clientKind === "entreprise"
      ? `Entreprise · ${me.user.organizationName ?? ""}`
      : me?.user?.clientKind === "syndicat"
        ? `Syndicat · ${me.user.organizationName ?? ""}`
        : null;

  return (
    <div className="px-4 py-5 sm:px-6 md:px-8 md:py-8">
      <h1 className="text-2xl font-extrabold md:text-3xl">
        {large ? "Devis · gros travaux" : "Publier un besoin"}
      </h1>
      <p className="mt-1 text-sm text-muted">
        {large
          ? "Pour les projets importants : les pros envoient des devis détaillés. Vous comparez puis choisissez."
          : "Les pros envoient des offres. Vous comparez prix, délais et notes — puis vous choisissez."}
      </p>
      {orgLabel ? <p className="mt-3 text-sm font-semibold text-appo">{orgLabel}</p> : null}
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
          {addresses.length > 1 ? (
            <select className={inputClass} value={addr?.id ?? ""} onChange={(e) => setAddressId(e.target.value)}>
              {addresses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label} — {a.line}, {a.city}
                </option>
              ))}
            </select>
          ) : (
            <input className={inputClass} readOnly value={addr ? `${addr.line}, ${addr.city}` : "Annecy"} />
          )}
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

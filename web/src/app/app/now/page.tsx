"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useMe } from "@/components/guard";
import { Button, Field, inputClass } from "@/components/ui";
import { api, fileToDataUrl, usePoll } from "@/lib/hooks";

function NowForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { data: me } = useMe();
  const { data } = usePoll<{ categories: { id: string; name: string; indicativePrice: number }[] }>("/api/categories", 0);
  const addr = me?.addresses?.find((a) => a.isDefault);
  const [categoryId, setCategoryId] = useState(params.get("categoryId") || "cat_plomberie");
  const [description, setDescription] = useState("Fuite sous évier");
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const cat = data?.categories.find((c) => c.id === categoryId);

  async function submit() {
    setLoading(true);
    try {
      const res = await api<{ mission: { id: string } }>("/api/missions", {
        type: "now",
        categoryId,
        description,
        photos,
        address: addr?.line ?? "12 rue de la République",
        city: addr?.city ?? "Rumilly",
        lat: addr?.lat ?? 45.8782,
        lng: addr?.lng ?? 6.0581,
      });
      router.replace(`/app/missions/${res.mission.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-5 py-6">
      <h1 className="text-2xl font-extrabold">AppO Now</h1>
      <p className="mt-1 text-sm text-muted">J’ai besoin d’un professionnel maintenant.</p>
      <div className="mt-6 space-y-4">
        <Field label="Service recherché">
          <select className={inputClass} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {(data?.categories ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Problème rencontré">
          <textarea className={inputClass} rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <Field label="Adresse">
          <input className={inputClass} readOnly value={addr ? `${addr.line}, ${addr.city}` : "Rumilly"} />
        </Field>
        <Field label="Photos (optionnel)">
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
        {photos[0] ? <img src={photos[0]} alt="" className="h-24 rounded-xl object-cover" /> : null}
        <div className="rounded-2xl bg-background p-4 text-sm">
          Estimation : <b>à partir de {cat?.indicativePrice ?? 59} €</b>
          <div className="text-muted">Le prix peut être ajusté sur place, avec votre accord.</div>
        </div>
        <Button variant="now" className="w-full" disabled={loading} onClick={submit}>
          {loading ? "Recherche…" : "Trouver un pro maintenant"}
        </Button>
      </div>
    </div>
  );
}

export default function NowPage() {
  return (
    <Suspense>
      <NowForm />
    </Suspense>
  );
}

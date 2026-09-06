"use client";

import { useRouter } from "next/navigation";
import { useMe } from "@/components/guard";
import { Button, Field, inputClass } from "@/components/ui";
import { api } from "@/lib/hooks";
import { useState } from "react";

export default function ProProfil() {
  const router = useRouter();
  const { data: me, reload } = useMe();
  const pro = me?.pro;
  const [description, setDescription] = useState(pro?.description ?? "");
  const [price, setPrice] = useState(pro?.startingPrice ?? 59);

  return (
    <div className="px-5 py-6">
      <h1 className="text-2xl font-extrabold">Profil</h1>
      <div className="mt-4 rounded-3xl bg-ink p-4 text-white">
        <div className="font-bold">{pro?.company}</div>
        <div className="text-sm opacity-70">SIRET {pro?.siret}</div>
        <div className="text-sm">{me?.user?.email}</div>
      </div>
      <div className="mt-4 space-y-3">
        <Field label="Description">
          <textarea className={inputClass} rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <Field label="Prix de départ (€)">
          <input className={inputClass} type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
        </Field>
        <Button
          className="w-full"
          onClick={async () => {
            await api("/api/pro", { description, startingPrice: price });
            reload();
          }}
        >
          Enregistrer
        </Button>
      </div>
      <Button
        className="mt-8 w-full"
        variant="secondary"
        onClick={async () => {
          await api("/api/auth/logout", {});
          router.replace("/");
        }}
      >
        Se déconnecter
      </Button>
    </div>
  );
}

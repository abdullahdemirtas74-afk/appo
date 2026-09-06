"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Field, inputClass } from "@/components/ui";
import { usePoll } from "@/lib/hooks";

export default function PlanifierPage() {
  const router = useRouter();
  const { data } = usePoll<{ categories: { id: string; name: string }[] }>("/api/categories", 0);
  const [categoryId, setCategoryId] = useState("cat_plomberie");
  const [when, setWhen] = useState("");

  return (
    <div className="px-5 py-6">
      <h1 className="text-2xl font-extrabold">Planifier</h1>
      <p className="mt-1 text-sm text-muted">Choisissez un service et un créneau, puis le professionnel.</p>
      <div className="mt-6 space-y-4">
        <Field label="Service">
          <select className={inputClass} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {(data?.categories ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Date et heure">
          <input className={inputClass} type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
        </Field>
        <Button
          variant="dark"
          className="w-full"
          onClick={() =>
            router.push(`/app/recherche?categoryId=${categoryId}&when=${encodeURIComponent(when)}`)
          }
        >
          Voir les professionnels
        </Button>
      </div>
    </div>
  );
}

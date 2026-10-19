"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, inputClass } from "@/components/ui";
import { usePoll } from "@/lib/hooks";

export default function PlanifierPage() {
  const router = useRouter();
  const { data } = usePoll<{ categories: { id: string; name: string }[] }>("/api/categories", 0);
  const categories = data?.categories ?? [];
  const [categoryId, setCategoryId] = useState("");
  const [when, setWhen] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!categoryId && categories.length > 0) setCategoryId(categories[0].id);
  }, [categories, categoryId]);

  function go() {
    setError("");
    if (!categoryId) {
      setError("Choisissez un service");
      return;
    }
    const p = new URLSearchParams({ categoryId });
    if (when) p.set("when", when);
    router.push(`/app/recherche?${p.toString()}`);
  }

  return (
    <div className="px-5 py-6">
      <h1 className="text-2xl font-extrabold">Planifier</h1>
      <p className="mt-1 text-sm text-muted">Choisissez un service et un créneau, puis le professionnel.</p>
      <div className="mt-6 space-y-4">
        <Field label="Service">
          <select
            className={inputClass}
            required
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            {categories.length === 0 ? <option value="">Chargement…</option> : null}
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Date et heure (optionnel)">
          <input
            className={inputClass}
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
          />
        </Field>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button variant="dark" className="w-full" onClick={go} disabled={!categoryId}>
          Voir les professionnels
        </Button>
      </div>
    </div>
  );
}

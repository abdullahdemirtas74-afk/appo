"use client";

import { useState } from "react";
import { api, usePoll } from "@/lib/hooks";
import { Button, inputClass } from "@/components/ui";

export default function AdminCategories() {
  const { data, reload } = usePoll<any>("/api/admin", 0);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("➕");
  const [price, setPrice] = useState(50);
  return (
    <div>
      <h1 className="text-3xl font-extrabold">Services</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        <input className={inputClass + " max-w-[180px]"} placeholder="Nom" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={inputClass + " max-w-[80px]"} value={emoji} onChange={(e) => setEmoji(e.target.value)} />
        <input className={inputClass + " max-w-[100px]"} type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
        <Button
          onClick={async () => {
            if (!name) return;
            await api("/api/admin", { action: "category", name, emoji, indicativePrice: price });
            setName("");
            reload();
          }}
        >
          Ajouter
        </Button>
      </div>
      <div className="mt-4 space-y-2">
        {(data?.categories ?? []).map((c: any) => (
          <div key={c.id} className="flex items-center justify-between rounded-2xl border border-line bg-white px-4 py-3">
            <div>
              {c.emoji} <b>{c.name}</b> · à partir de {c.indicativePrice} €
            </div>
            <Button
              variant="secondary"
              onClick={async () => {
                await api("/api/admin", { action: "category", id: c.id, active: !c.active });
                reload();
              }}
            >
              {c.active ? "Masquer" : "Afficher"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

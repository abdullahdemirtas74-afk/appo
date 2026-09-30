"use client";

import { useMe } from "@/components/guard";
import { Button, Field, inputClass } from "@/components/ui";
import { api, usePoll } from "@/lib/hooks";
import { formatDate, moneyExact } from "@/lib/format";
import { useState } from "react";

export default function WalletPage() {
  const { data: me, reload: reloadMe } = useMe();
  const { data, reload } = usePoll<any>("/api/growth", 4000);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");

  return (
    <div className="px-5 py-6 pb-10">
      <h1 className="text-2xl font-extrabold">AppO Wallet</h1>
      <p className="mt-1 text-sm text-muted">Crédits, parrainages, remboursements et avoirs.</p>
      <div className="mt-4 rounded-3xl bg-ink p-5 text-white">
        <div className="text-sm opacity-70">Solde disponible</div>
        <div className="text-3xl font-black">{moneyExact(data?.walletBalance ?? me?.walletBalance ?? 0)}</div>
        <div className="mt-2 text-xs opacity-70">Code parrain : {data?.referralCode ?? me?.referralCode}</div>
      </div>

      <div className="mt-4 rounded-3xl border border-line p-4">
        <div className="font-bold">Utiliser un code parrain</div>
        <Field label="Code">
          <input className={inputClass} value={code} onChange={(e) => setCode(e.target.value)} placeholder="SARA0071" />
        </Field>
        <Button
          className="mt-2 w-full"
          onClick={async () => {
            try {
              await api("/api/growth", { action: "applyReferralCode", code });
              setMsg("Code appliqué");
              reload();
              reloadMe();
            } catch (e) {
              setMsg(e instanceof Error ? e.message : "Erreur");
            }
          }}
        >
          Valider
        </Button>
        {msg ? <p className="mt-2 text-sm text-muted">{msg}</p> : null}
      </div>

      <h2 className="mt-6 font-bold">Historique</h2>
      <div className="mt-2 space-y-2">
        {(data?.ledgers ?? []).length === 0 ? <p className="text-sm text-muted">Aucune opération.</p> : null}
        {(data?.ledgers ?? []).map((l: any) => (
          <div key={l.id} className="flex justify-between rounded-2xl border border-line px-4 py-3 text-sm">
            <div>
              <div className="font-semibold">{l.label}</div>
              <div className="text-xs text-muted">{formatDate(l.createdAt)} · {l.kind}</div>
            </div>
            <div className={`font-bold ${l.amount >= 0 ? "text-green" : "text-appo"}`}>
              {l.amount >= 0 ? "+" : ""}
              {moneyExact(l.amount)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

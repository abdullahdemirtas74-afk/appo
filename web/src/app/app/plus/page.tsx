"use client";

import { useState } from "react";
import { useMe } from "@/components/guard";
import { Button } from "@/components/ui";
import { api } from "@/lib/hooks";
import { money } from "@/lib/format";

export default function ClientPlusPage() {
  const { data: me, reload } = useMe();
  const [loading, setLoading] = useState<"monthly" | "yearly" | null>(null);
  const settings = me?.settings;
  const active = Boolean(me?.clientPlusActive);

  async function subscribe(plan: "monthly" | "yearly") {
    setLoading(plan);
    try {
      await api("/api/me", { action: "subscribePlus", plan });
      await reload();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="px-5 py-6 pb-10">
      <p className="text-xs font-bold uppercase tracking-wide text-appo">Abonnement client</p>
      <h1 className="mt-1 text-3xl font-extrabold">AppO+</h1>
      <p className="mt-2 max-w-xl text-muted">
        Moins de commission plateforme, négociation du prix affiché, et alertes prioritaires pour les pros près de vous.
      </p>

      {active ? (
        <div className="mt-6 rounded-3xl bg-ink p-5 text-white">
          <div className="text-lg font-bold">AppO+ actif</div>
          <p className="text-sm opacity-80">Encore {me?.clientPlusDaysLeft ?? 0} jour(s)</p>
        </div>
      ) : null}

      <div className="mt-6 grid max-w-2xl gap-3 sm:grid-cols-2">
        <div className="rounded-3xl border border-line p-5">
          <div className="text-sm text-muted">Mensuel</div>
          <div className="text-3xl font-black">{money(settings?.clientPlusMonthlyPrice ?? 9.9)}</div>
          <p className="mt-1 text-xs text-muted">/ 30 jours</p>
          <Button
            className="mt-4 w-full"
            variant="now"
            disabled={loading !== null}
            onClick={() => subscribe("monthly")}
          >
            {loading === "monthly" ? "Activation…" : active ? "Renouveler" : "S’abonner"}
          </Button>
        </div>
        <div className="rounded-3xl border border-appo/40 bg-appo/5 p-5">
          <div className="text-sm text-muted">Annuel</div>
          <div className="text-3xl font-black">{money(settings?.clientPlusYearlyPrice ?? 89)}</div>
          <p className="mt-1 text-xs text-muted">/ 12 mois · ~2 mois offerts</p>
          <Button
            className="mt-4 w-full"
            variant="dark"
            disabled={loading !== null}
            onClick={() => subscribe("yearly")}
          >
            {loading === "yearly" ? "Activation…" : active ? "Renouveler" : "S’abonner"}
          </Button>
        </div>
      </div>

      <ul className="mt-8 max-w-xl space-y-3 text-sm">
        {[
          "Commission plateforme réduite sur vos missions (meilleure attractivité pour les pros)",
          "Négocier le prix quand le pro l’affiche",
          "Alertes prioritaires ⭐ envoyées aux pros à proximité",
          "Confidentialité inchangée : contacts débloqués seulement après acceptation",
        ].map((t) => (
          <li key={t} className="flex gap-2 rounded-2xl border border-line px-4 py-3">
            <span className="font-bold text-appo">+</span>
            <span>{t}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-muted">Paiement simulé — aucune carte stockée chez AppO.</p>
    </div>
  );
}

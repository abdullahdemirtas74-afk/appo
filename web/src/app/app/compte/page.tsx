"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useMe } from "@/components/guard";
import { Button, Field, inputClass } from "@/components/ui";
import { api, usePoll } from "@/lib/hooks";
import type { ClientKind } from "@/lib/types";

const KIND_LABEL: Record<ClientKind, string> = {
  particulier: "Particulier",
  entreprise: "Entreprise",
  syndicat: "Syndicat",
};

function CompteContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { data: me, reload: refreshMe } = useMe();
  const { data } = usePoll<{ missions: any[] }>("/api/missions", 0);
  const user = me?.user;
  const [kind, setKind] = useState<ClientKind>("particulier");
  const [organizationName, setOrganizationName] = useState("");
  const [organizationSiret, setOrganizationSiret] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!user) return;
    const fromUrl = params.get("kind");
    const nextKind =
      fromUrl === "entreprise" || fromUrl === "syndicat" || fromUrl === "particulier"
        ? fromUrl
        : (user.clientKind ?? "particulier");
    setKind(nextKind);
    setOrganizationName(user.organizationName ?? "");
    setOrganizationSiret(user.organizationSiret ?? "");
  }, [user, params]);

  async function saveOrg() {
    setSaving(true);
    setMsg("");
    try {
      await api("/api/me", {
        clientKind: kind,
        organizationName: kind === "particulier" ? "" : organizationName,
        organizationSiret: kind === "particulier" ? "" : organizationSiret,
      });
      await refreshMe();
      setMsg("Profil mis à jour");
    } catch (e) {
      setMsg(e instanceof Error && e.message === "ORG_REQUIRED" ? "Indiquez le nom de l’organisation" : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="px-5 py-6">
      <h1 className="text-2xl font-extrabold">Mon compte</h1>
      <div className="mt-4 rounded-3xl bg-ink p-5 text-white">
        <div className="text-lg font-bold">
          {user?.firstName} {user?.lastName}
        </div>
        <div className="text-sm opacity-70">{user?.email}</div>
        <div className="text-sm opacity-70">{user?.phone}</div>
        {user?.clientKind && user.clientKind !== "particulier" && user.organizationName ? (
          <div className="mt-2 text-sm font-semibold text-white/90">
            {KIND_LABEL[user.clientKind]} · {user.organizationName}
          </div>
        ) : (
          <div className="mt-2 text-sm opacity-70">{KIND_LABEL[user?.clientKind ?? "particulier"]}</div>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-line p-4">
        <h2 className="font-bold">Type de compte</h2>
        <p className="mt-1 text-sm text-muted">
          Entreprises et syndicats : indiquez votre structure pour publier des besoins professionnels.
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {(["particulier", "entreprise", "syndicat"] as ClientKind[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`rounded-xl border px-2 py-2.5 text-xs font-semibold sm:text-sm ${
                kind === k ? "border-appo bg-appo/5 text-appo" : "border-line text-muted"
              }`}
            >
              {KIND_LABEL[k]}
            </button>
          ))}
        </div>
        {kind !== "particulier" ? (
          <div className="mt-3 space-y-3">
            <Field label={kind === "syndicat" ? "Nom du syndicat / copropriété" : "Nom de l’entreprise"}>
              <input
                className={inputClass}
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder={kind === "syndicat" ? "Ex. Syndic Les Alpes" : "Ex. Dupont & Fils"}
              />
            </Field>
            <Field label="SIRET (optionnel)">
              <input
                className={inputClass}
                value={organizationSiret}
                onChange={(e) => setOrganizationSiret(e.target.value)}
              />
            </Field>
          </div>
        ) : null}
        <Button className="mt-4 w-full" variant="secondary" disabled={saving} onClick={saveOrg}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
        {msg ? <p className="mt-2 text-center text-sm text-muted">{msg}</p> : null}
      </div>

      <div className="mt-4 space-y-2 text-sm">
        {[
          ["Mes informations", user ? `${user.firstName} ${user.lastName}` : ""],
          ["Mes adresses", me?.addresses?.map((a) => a.label).join(", ") || "—"],
          ["Moyens de paiement", "Carte · Apple Pay · Google Pay (simulés)"],
          ["Mes réservations", `${data?.missions?.length ?? 0} missions`],
          ["Mes factures", `${data?.missions?.filter((m) => m.paymentStatus === "paid").length ?? 0} factures`],
          ["Professionnels favoris", `${me?.favorites?.length ?? 0}`],
          ["Parrainage", "Bientôt"],
          ["Aide", "aide@appo.fr"],
          ["Paramètres", "Notifications, RGPD"],
        ].map(([k, v]) => (
          <div key={k} className="flex items-center justify-between rounded-2xl border border-line px-4 py-3">
            <span className="font-semibold">{k}</span>
            <span className="max-w-[50%] truncate text-muted">{v}</span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted">
        Conformité RGPD V1 : vous pouvez demander la suppression du compte. AppO ne stocke jamais de numéro de carte.
      </p>
      <Button
        className="mt-6 w-full"
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

export default function ComptePage() {
  return (
    <Suspense>
      <CompteContent />
    </Suspense>
  );
}

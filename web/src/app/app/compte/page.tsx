"use client";

import { useRouter } from "next/navigation";
import { useMe } from "@/components/guard";
import { Button } from "@/components/ui";
import { api, usePoll } from "@/lib/hooks";
import type { ClientKind } from "@/lib/types";

const KIND_LABEL: Record<ClientKind, string> = {
  particulier: "Particulier",
  entreprise: "Entreprise",
  syndicat: "Syndicat",
};

export default function ComptePage() {
  const router = useRouter();
  const { data: me } = useMe();
  const { data } = usePoll<{ missions: any[] }>("/api/missions", 0);
  const user = me?.user;
  const kind = (user?.clientKind ?? "particulier") as ClientKind;

  return (
    <div className="px-5 py-6">
      <h1 className="text-2xl font-extrabold">Mon compte</h1>
      <div className="mt-4 rounded-3xl bg-ink p-5 text-white">
        <div className="text-lg font-bold">
          {user?.firstName} {user?.lastName}
        </div>
        <div className="text-sm opacity-70">{user?.email}</div>
        <div className="text-sm opacity-70">{user?.phone}</div>
        <div className="mt-2 text-sm font-semibold text-white/90">
          {KIND_LABEL[kind]}
          {kind !== "particulier" && user?.organizationName ? ` · ${user.organizationName}` : ""}
        </div>
        <p className="mt-1 text-xs opacity-60">Type de compte défini à l’inscription</p>
      </div>

      <div className="mt-4 space-y-2 text-sm">
        {[
          ["Mes informations", user ? `${user.firstName} ${user.lastName}` : ""],
          ["Type de compte", KIND_LABEL[kind]],
          ["AppO+", me?.clientPlusActive ? `Actif · ${me.clientPlusDaysLeft} j` : "Non abonné — /app/plus"],
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

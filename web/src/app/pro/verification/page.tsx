"use client";

import Link from "next/link";
import { useMe } from "@/components/guard";
import { Badge, Button, inputClass } from "@/components/ui";
import { api } from "@/lib/hooks";
import { useState } from "react";

const STATUS_LABEL: Record<string, string> = {
  missing: "Manquant",
  pending: "En revue",
  approved: "Validé",
  rejected: "Refusé",
};

export default function ProVerificationPage() {
  const { data: me, reload } = useMe();
  const pro = me?.pro as any;
  const checklist = pro?.checklist ?? [];
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  if (!pro) return <div className="p-6 text-muted">Chargement…</div>;

  async function upload(type: string, name: string) {
    setBusy(true);
    setMsg("");
    try {
      await api("/api/support", { action: "submitDocument", type, name });
      await reload();
      setMsg("Document enregistré");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="px-5 py-6 pb-10">
      <Link href="/pro" className="text-sm font-semibold text-appo">
        ← Accueil
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold">Vérification Pro</h1>
      <p className="mt-1 text-sm text-muted">
        Déposez vos documents pour obtenir le badge Pro vérifié et recevoir des missions.
      </p>

      <div className="mt-4 rounded-3xl border border-line bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={pro.status === "verified" ? "green" : pro.status === "pending" ? "orange" : "red"}>
            {pro.status === "verified" ? "Vérifié" : pro.status === "pending" ? "En attente" : pro.status}
          </Badge>
          {pro.verifiedComplete ? <Badge tone="green">Dossier complet</Badge> : null}
        </div>
        {pro.verificationNote ? <p className="mt-2 text-sm text-muted">Note admin : {pro.verificationNote}</p> : null}
        {pro.verificationSubmittedAt ? (
          <p className="mt-1 text-xs text-muted">
            Dernière soumission : {new Date(pro.verificationSubmittedAt).toLocaleString("fr-FR")}
          </p>
        ) : null}
      </div>

      <div className="mt-4 space-y-3">
        {checklist.map((row: any) => (
          <div key={row.type} className="rounded-3xl border border-line p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-bold">
                  {row.label}
                  {row.required ? "" : " · optionnel"}
                </div>
                <div className="text-sm text-muted">{row.doc?.name ?? "Aucun fichier"}</div>
                {row.doc?.rejectReason ? <p className="mt-1 text-sm text-red-600">{row.doc.rejectReason}</p> : null}
              </div>
              <Badge
                tone={row.status === "approved" ? "green" : row.status === "rejected" ? "red" : row.status === "pending" ? "orange" : "neutral"}
              >
                {STATUS_LABEL[row.status] ?? row.status}
              </Badge>
            </div>
            {row.status !== "approved" ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() => upload(row.type, `${row.type}_${Date.now()}.pdf`)}
                >
                  {row.status === "missing" || row.status === "rejected" ? "Déposer (simulé)" : "Remplacer"}
                </Button>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <Button
        className="mt-6 w-full"
        variant="now"
        disabled={busy || !pro.docsReadyForReview || pro.status === "verified"}
        onClick={async () => {
          setBusy(true);
          setMsg("");
          try {
            await api("/api/support", { action: "submitVerification" });
            await reload();
            setMsg("Dossier envoyé à l’admin");
          } catch (e) {
            setMsg(e instanceof Error ? e.message : "Erreur");
          } finally {
            setBusy(false);
          }
        }}
      >
        Soumettre le dossier à AppO
      </Button>
      {msg ? <p className="mt-3 text-center text-sm text-muted">{msg}</p> : null}
      <p className="mt-4 text-sm text-muted">
        En V1 les fichiers sont simulés (pas d’upload cloud). Les 3 documents obligatoires doivent être validés un
        par un par l’admin.
      </p>
    </div>
  );
}

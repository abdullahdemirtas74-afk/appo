"use client";

import Link from "next/link";
import { useMe } from "@/components/guard";
import { Badge, Button } from "@/components/ui";
import { api, uploadFile } from "@/lib/hooks";
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

  async function onFile(type: string, file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setMsg("");
    try {
      const uploaded = await uploadFile(file);
      await api("/api/support", {
        action: "submitDocument",
        type,
        name: uploaded.name,
        url: uploaded.url,
      });
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
        Déposez vos documents (PDF ou photo) pour obtenir le badge Pro vérifié.
      </p>

      <div className="mt-4 rounded-3xl border border-line bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={pro.status === "verified" ? "green" : pro.status === "pending" ? "orange" : "red"}>
            {pro.status === "verified" ? "Vérifié" : pro.status === "pending" ? "En attente" : pro.status}
          </Badge>
          {pro.verifiedComplete ? <Badge tone="green">Dossier complet</Badge> : null}
        </div>
        {pro.verificationNote ? <p className="mt-2 text-sm text-muted">Note admin : {pro.verificationNote}</p> : null}
      </div>

      <div className="mt-4 space-y-3">
        {checklist.map((row: any) => (
          <div key={row.type} className="rounded-3xl border border-line p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-bold">
                  {row.label}
                  {row.required ? "" : " · optionnel"}
                </div>
                <div className="truncate text-sm text-muted">{row.doc?.name ?? "Aucun fichier"}</div>
                {row.doc?.url ? (
                  <a className="mt-1 inline-block text-sm font-semibold text-appo" href={row.doc.url} target="_blank" rel="noreferrer">
                    Voir le fichier
                  </a>
                ) : null}
                {row.doc?.rejectReason ? <p className="mt-1 text-sm text-red-600">{row.doc.rejectReason}</p> : null}
              </div>
              <Badge
                tone={row.status === "approved" ? "green" : row.status === "rejected" ? "red" : row.status === "pending" ? "orange" : "neutral"}
              >
                {STATUS_LABEL[row.status] ?? row.status}
              </Badge>
            </div>
            {row.status !== "approved" ? (
              <label className="mt-3 block">
                <span className="sr-only">Déposer {row.label}</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  disabled={busy}
                  className="w-full text-sm"
                  onChange={(e) => onFile(row.type, e.target.files?.[0])}
                />
              </label>
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
      <p className="mt-4 text-sm text-muted">Formats : JPG, PNG, WebP, PDF — max 5 Mo (images) / 8 Mo (PDF).</p>
    </div>
  );
}

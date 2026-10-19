"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FaceIdCapture, FaceIdDoneBanner } from "@/components/face-id-capture";
import { useMe } from "@/components/guard";
import { Badge, Button, Field, inputClass } from "@/components/ui";
import { api, uploadFile } from "@/lib/hooks";

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
  const [faceStep, setFaceStep] = useState<"identite" | "selfie" | "done">("identite");
  const [siretInput, setSiretInput] = useState("");

  const idDoc = useMemo(
    () => checklist.find((r: any) => r.type === "identite"),
    [checklist],
  );
  const selfieDoc = useMemo(
    () => checklist.find((r: any) => r.type === "selfie"),
    [checklist],
  );
  const otherDocs = useMemo(
    () => checklist.filter((r: any) => r.type !== "identite" && r.type !== "selfie"),
    [checklist],
  );

  if (!pro) return <div className="p-6 text-muted">Chargement…</div>;

  async function uploadDoc(type: string, file: File) {
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
      return true;
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erreur");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function runFaceId() {
    setBusy(true);
    setMsg("");
    try {
      await api("/api/support", { action: "completeFaceId", method: "camera" });
      await reload();
      setFaceStep("done");
      setMsg("Face ID validé");
    } catch (e) {
      setMsg(
        e instanceof Error && e.message === "FACE_ID_INCOMPLETE"
          ? "Photographiez d’abord la CNI et le selfie"
          : e instanceof Error
            ? e.message
            : "Erreur Face ID",
      );
    } finally {
      setBusy(false);
    }
  }

  const faceDone = Boolean(pro.faceIdVerifiedAt);
  const siretOk = pro.siretStatus === "valid" || pro.siretOk;
  const hoursLeft = pro.hoursUntilConfirm;

  return (
    <div className="px-5 py-6 pb-10">
      <Link href="/pro" className="text-sm font-semibold text-appo">
        ← Accueil
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold">Vérification Pro</h1>
      <p className="mt-1 text-sm text-muted">
        Face ID + carte d’identité, SIRET automatique, puis confirmation du compte sous 24h.
      </p>

      <div className="mt-4 rounded-3xl border border-line bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={pro.status === "verified" ? "green" : pro.status === "pending" ? "orange" : "red"}>
            {pro.status === "verified" ? "Compte ouvert" : pro.status === "pending" ? "En attente" : pro.status}
          </Badge>
          {siretOk ? <Badge tone="green">SIRET OK</Badge> : <Badge tone="orange">SIRET</Badge>}
          {faceDone ? <Badge tone="green">Face ID OK</Badge> : <Badge tone="orange">Face ID</Badge>}
          {pro.verifiedComplete ? <Badge tone="green">Dossier complet</Badge> : null}
        </div>
        {pro.verificationDueAt && pro.status === "pending" ? (
          <p className="mt-2 text-sm text-muted">
            Confirmation automatique prévue le{" "}
            <b>{new Date(pro.verificationDueAt).toLocaleString("fr-FR")}</b>
            {typeof hoursLeft === "number" ? ` (≈ ${hoursLeft} h)` : ""}.
          </p>
        ) : null}
        {pro.verifiedAt ? (
          <p className="mt-2 text-sm text-emerald-700">
            Compte confirmé le {new Date(pro.verifiedAt).toLocaleString("fr-FR")}.
          </p>
        ) : null}
        {pro.verificationNote ? <p className="mt-2 text-sm text-muted">Note : {pro.verificationNote}</p> : null}
        {pro.siretLegalName ? (
          <p className="mt-2 text-sm text-muted">
            Entreprise : <b>{pro.siretLegalName}</b>
            {pro.siretNaf ? ` · NAF ${pro.siretNaf}` : ""}
          </p>
        ) : null}
      </div>

      {/* SIRET */}
      <div className="mt-4 rounded-3xl border border-line p-4">
        <div className="font-bold">1. Vérification SIRET automatique</div>
        <p className="mt-1 text-sm text-muted">
          Contrôle Luhn + API Recherche d’entreprises (data.gouv.fr).
        </p>
        <p className="mt-2 text-sm">
          SIRET actuel : <b>{pro.siret}</b>{" "}
          {siretOk ? (
            <span className="text-emerald-700">validé</span>
          ) : (
            <span className="text-amber-700">{pro.siretStatus || "à vérifier"}</span>
          )}
        </p>
        <div className="mt-3 flex gap-2">
          <div className="min-w-0 flex-1">
            <Field label="SIRET">
              <input
                className={inputClass}
                placeholder={pro.siret || "14 chiffres"}
                value={siretInput}
                onChange={(e) => setSiretInput(e.target.value)}
                inputMode="numeric"
              />
            </Field>
          </div>
          <Button
            className="self-end"
            variant="secondary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setMsg("");
              try {
                await api("/api/support", {
                  action: "recheckSiret",
                  siret: siretInput || pro.siret,
                });
                setSiretInput("");
                await reload();
                setMsg("SIRET vérifié");
              } catch (e) {
                const code = e instanceof Error ? e.message : "";
                setMsg(
                  code === "SIRET_INVALID"
                    ? "SIRET invalide"
                    : code === "SIRET_INACTIVE"
                      ? "Établissement radié / inactif"
                      : code === "SIRET_NOT_FOUND"
                        ? "SIRET introuvable"
                        : code || "Erreur SIRET",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            Vérifier
          </Button>
        </div>
      </div>

      {/* Face ID */}
      <div className="mt-4 rounded-3xl border border-line p-4">
        <div className="font-bold">2. Face ID + carte d’identité</div>
        <p className="mt-1 text-sm text-muted">
          Photographiez votre CNI puis un selfie vivant. AppO valide le couple automatiquement.
        </p>

        {faceDone ? (
          <div className="mt-3 space-y-2">
            <FaceIdDoneBanner label="Face ID validé — identité confirmée" />
            {idDoc?.doc?.url ? (
              <a className="text-sm font-semibold text-appo" href={idDoc.doc.url} target="_blank" rel="noreferrer">
                Voir la CNI
              </a>
            ) : null}
          </div>
        ) : (
          <div className="mt-3 space-y-4">
            <div className="flex gap-2 text-sm">
              <button
                type="button"
                className={`rounded-full px-3 py-1 font-semibold ${faceStep === "identite" ? "bg-ink text-white" : "border border-line"}`}
                onClick={() => setFaceStep("identite")}
              >
                1 · CNI
              </button>
              <button
                type="button"
                className={`rounded-full px-3 py-1 font-semibold ${faceStep === "selfie" ? "bg-ink text-white" : "border border-line"}`}
                onClick={() => setFaceStep("selfie")}
              >
                2 · Selfie
              </button>
            </div>

            {faceStep === "identite" ? (
              <div className="space-y-2">
                {idDoc?.doc?.url ? (
                  <FaceIdDoneBanner label={`CNI enregistrée (${STATUS_LABEL[idDoc.status] ?? idDoc.status})`} />
                ) : null}
                <FaceIdCapture
                  mode="identite"
                  disabled={busy}
                  onCapture={async (file) => {
                    const ok = await uploadDoc("identite", file);
                    if (ok) setFaceStep("selfie");
                  }}
                />
                <label className="block text-xs text-muted">
                  Ou importer un fichier
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    disabled={busy}
                    className="mt-1 w-full"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const ok = await uploadDoc("identite", f);
                      if (ok) setFaceStep("selfie");
                    }}
                  />
                </label>
              </div>
            ) : (
              <div className="space-y-2">
                {selfieDoc?.doc?.url ? (
                  <FaceIdDoneBanner label={`Selfie enregistré (${STATUS_LABEL[selfieDoc.status] ?? selfieDoc.status})`} />
                ) : null}
                <FaceIdCapture
                  mode="selfie"
                  disabled={busy}
                  onCapture={async (file) => {
                    const ok = await uploadDoc("selfie", file);
                    if (ok) await runFaceId();
                  }}
                />
                {idDoc?.doc?.url && selfieDoc?.doc?.url && !faceDone ? (
                  <Button className="w-full" variant="now" disabled={busy} onClick={runFaceId}>
                    Lancer la vérification Face ID
                  </Button>
                ) : null}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Other docs */}
      <div className="mt-4 space-y-3">
        <div className="font-bold">3. Documents entreprise</div>
        {otherDocs.map((row: any) => (
          <div key={row.type} className="rounded-3xl border border-line p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-bold">
                  {row.label}
                  {row.required ? "" : " · optionnel"}
                </div>
                <div className="truncate text-sm text-muted">{row.doc?.name ?? "Aucun fichier"}</div>
                {row.doc?.url ? (
                  <a
                    className="mt-1 inline-block text-sm font-semibold text-appo"
                    href={row.doc.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Voir le fichier
                  </a>
                ) : null}
                {row.doc?.rejectReason ? <p className="mt-1 text-sm text-red-600">{row.doc.rejectReason}</p> : null}
              </div>
              <Badge
                tone={
                  row.status === "approved"
                    ? "green"
                    : row.status === "rejected"
                      ? "red"
                      : row.status === "pending"
                        ? "orange"
                        : "neutral"
                }
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
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void uploadDoc(row.type, f);
                  }}
                />
              </label>
            ) : null}
          </div>
        ))}
      </div>

      <Button
        className="mt-6 w-full"
        variant="now"
        disabled={
          busy ||
          !pro.docsReadyForReview ||
          !faceDone ||
          !siretOk ||
          pro.status === "verified"
        }
        onClick={async () => {
          setBusy(true);
          setMsg("");
          try {
            await api("/api/support", { action: "submitVerification" });
            await reload();
            setMsg("Dossier envoyé — confirmation automatique sous 24h");
          } catch (e) {
            const code = e instanceof Error ? e.message : "";
            setMsg(
              code === "FACE_ID_REQUIRED"
                ? "Validez d’abord le Face ID"
                : code === "SIRET_REQUIRED"
                  ? "SIRET non validé"
                  : code === "DOCS_INCOMPLETE"
                    ? "Documents incomplets"
                    : code || "Erreur",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        Soumettre — confirmation sous 24h
      </Button>
      {msg ? <p className="mt-3 text-center text-sm text-muted">{msg}</p> : null}
      <p className="mt-4 text-sm text-muted">
        Après soumission, votre compte Pro s’ouvre automatiquement sous 24h si SIRET + Face ID +
        documents sont OK. Un admin peut aussi valider plus tôt.
      </p>
    </div>
  );
}

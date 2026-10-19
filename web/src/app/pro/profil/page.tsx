"use client";

import { useRouter } from "next/navigation";
import { useMe } from "@/components/guard";
import { LanguageSettings } from "@/components/language-settings";
import { Button, Field, inputClass } from "@/components/ui";
import { api } from "@/lib/hooks";
import { useEffect, useState } from "react";

export default function ProProfil() {
  const router = useRouter();
  const { data: me, reload } = useMe();
  const pro = me?.pro;
  const [description, setDescription] = useState(pro?.description ?? "");
  const [price, setPrice] = useState(pro?.startingPrice ?? 59);
  const [delay, setDelay] = useState(pro?.payoutDelayDays ?? 7);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdMsg, setPwdMsg] = useState("");
  const [pwdBusy, setPwdBusy] = useState(false);
  useEffect(() => {
    if (typeof pro?.payoutDelayDays === "number") setDelay(pro.payoutDelayDays);
  }, [pro?.payoutDelayDays]);

  return (
    <div className="px-5 py-6">
      <h1 className="text-2xl font-extrabold">Profil</h1>
      <div className="mt-4 rounded-3xl bg-ink p-4 text-white">
        <div className="font-bold">{pro?.company}</div>
        <div className="text-sm opacity-70">SIRET {pro?.siret}</div>
        <div className="text-sm">{me?.user?.email}</div>
        <div className="mt-2 text-xs opacity-80">Code parrain : {me?.referralCode ?? "—"}</div>
      </div>
      <div className="mt-4 space-y-3">
        <Field label="Description">
          <textarea className={inputClass} rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <Field label="Prix de départ (€)">
          <input className={inputClass} type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
        </Field>
        <Field label="Délai de versement (0 à 30 jours)">
          <input
            className={inputClass}
            type="number"
            min={0}
            max={30}
            value={delay}
            onChange={(e) => setDelay(Math.max(0, Math.min(30, Number(e.target.value) || 0)))}
          />
        </Field>
        <div className="flex flex-wrap gap-2">
          {[0, 7, 14, 30].map((n) => (
            <button
              key={n}
              type="button"
              className={`rounded-full px-3 py-1 text-sm font-semibold ${delay === n ? "bg-ink text-white" : "border border-line"}`}
              onClick={() => setDelay(n)}
            >
              {n === 0 ? "Immédiat" : `${n} j`}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted">
          Appo encaisse le client dès que vous acceptez et garde les fonds jusqu’à la fin de l’intervention. Vous êtes payé ensuite, après ce délai.
        </p>
        <Button
          className="w-full"
          onClick={async () => {
            await api("/api/pro", { description, startingPrice: price, payoutDelayDays: delay });
            reload();
          }}
        >
          Enregistrer
        </Button>
        <Button className="w-full" variant="secondary" href="/pro/verification">
          Vérification documents
        </Button>
      </div>
      <div className="mt-8 space-y-2">
        <Button className="w-full" variant="secondary" href="/pro/factures">
          Devis & factures
        </Button>
        <Button className="w-full" variant="secondary" href="/pro/planning">
          Planning & congés
        </Button>
        <Button className="w-full" variant="secondary" href="/pro/revenus">
          Stats & revenus
        </Button>
        <Button className="w-full" variant="secondary" href="/pro/business">
          AppO Business
        </Button>
        <Button className="w-full" variant="secondary" href="/pro/premium">
          AppO Premium
        </Button>
      </div>
      <div className="mt-8 rounded-3xl border border-line p-4">
        <h2 className="font-bold">Mot de passe</h2>
        <p className="mt-1 text-sm text-muted">Changez votre mot de passe sur AppO.</p>
        <div className="mt-3 space-y-3">
          <Field label="Mot de passe actuel">
            <input
              className={inputClass}
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </Field>
          <Field label="Nouveau mot de passe">
            <input
              className={inputClass}
              type="password"
              minLength={8}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </Field>
          <Field label="Confirmer">
            <input
              className={inputClass}
              type="password"
              minLength={8}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </Field>
          <Button
            className="w-full"
            variant="secondary"
            disabled={pwdBusy}
            onClick={async () => {
              setPwdMsg("");
              if (newPassword.length < 8) {
                setPwdMsg("Mot de passe : 8 caractères minimum");
                return;
              }
              if (newPassword !== confirmPassword) {
                setPwdMsg("Les mots de passe ne correspondent pas");
                return;
              }
              setPwdBusy(true);
              try {
                await api("/api/me", {
                  action: "changePassword",
                  currentPassword,
                  newPassword,
                });
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setPwdMsg("Mot de passe mis à jour");
              } catch (err) {
                const code = err instanceof Error ? err.message : "";
                setPwdMsg(
                  code === "INVALID_CREDENTIALS"
                    ? "Mot de passe actuel incorrect"
                    : "Impossible de changer le mot de passe",
                );
              } finally {
                setPwdBusy(false);
              }
            }}
          >
            {pwdBusy ? "Enregistrement…" : "Mettre à jour le mot de passe"}
          </Button>
          {pwdMsg ? <p className="text-center text-sm text-muted">{pwdMsg}</p> : null}
        </div>
      </div>
      <div className="mt-8 rounded-3xl border border-line p-4">
        <LanguageSettings onSaved={() => reload()} />
      </div>
      <Button
        className="mt-4 w-full"
        variant="secondary"
        onClick={async () => {
          await api("/api/me", { action: "resetOnboarding" });
          router.push("/pro/onboarding");
        }}
      >
        Revoir le guide de démarrage
      </Button>
      <div className="mt-6 space-y-2 text-sm">
        <a href="/legal" className="flex w-full items-center justify-between rounded-2xl border border-line px-4 py-3 font-semibold">
          Informations légales
          <span className="text-muted">CGU · confidentialité</span>
        </a>
        <a href="/remboursement" className="flex w-full items-center justify-between rounded-2xl border border-line px-4 py-3 font-semibold">
          Annulations & remboursements
          <span className="text-appo">→</span>
        </a>
      </div>
      <Button
        className="mt-8 w-full"
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

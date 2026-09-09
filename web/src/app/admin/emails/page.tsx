"use client";

import { api, usePoll } from "@/lib/hooks";
import { Badge, Button } from "@/components/ui";

const STATUS_LABEL: Record<string, string> = {
  pending_account: "En attente compte mail",
  queued: "File d’attente",
  sent: "Envoyé",
  skipped_quota: "Plafond atteint",
  failed: "Échec",
};

export default function AdminEmails() {
  const { data, reload } = usePoll<any>("/api/admin", 5000);
  const mail = data?.mail;
  const provider = mail?.provider;
  const active = Boolean(provider?.enabled);

  return (
    <div>
      <h1 className="text-3xl font-extrabold">E-mails Pros</h1>
      <p className="mt-1 text-sm text-muted">
        Plafond de {mail?.limit ?? 100} e-mails / jour vers les professionnels — prêt dès l’ouverture du compte
        mail.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-3xl border border-line bg-white p-4">
          <div className="text-xs text-muted">Compte mail</div>
          <div className="mt-1 text-xl font-black">{active ? "Actif" : "Fermé"}</div>
          <div className="mt-1 text-xs text-muted">
            {provider?.configured
              ? `Resend · ${provider.from}`
              : "Configurer APPO_MAIL_FROM + APPO_RESEND_API_KEY + APPO_MAIL_ENABLED=true"}
          </div>
        </div>
        <div className="rounded-3xl border border-line bg-white p-4">
          <div className="text-xs text-muted">Aujourd’hui ({mail?.day ?? "—"})</div>
          <div className="mt-1 text-xl font-black">
            {mail?.used ?? 0} / {mail?.limit ?? 100}
          </div>
          <div className="mt-1 text-xs text-muted">{mail?.remaining ?? 100} restants</div>
        </div>
        <div className="rounded-3xl border border-line bg-white p-4">
          <div className="text-xs text-muted">Actions</div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              disabled={!active}
              onClick={async () => {
                await api("/api/admin", { action: "promoteProEmails" });
                reload();
              }}
            >
              Relancer la file du jour
            </Button>
            <Button
              variant="secondary"
              onClick={async () => {
                const n = prompt("Nouveau plafond journalier (1–500)", String(mail?.limit ?? 100));
                if (!n) return;
                await api("/api/admin", { action: "settings", proEmailDailyLimit: Number(n) });
                reload();
              }}
            >
              Modifier le plafond
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-line bg-white p-5">
        <h2 className="font-bold">Journal récent</h2>
        <p className="mt-1 text-sm text-muted">
          Missions Now/urgence, demandes RFQ et validations admin génèrent un e-mail pro (sous plafond).
        </p>
        <div className="mt-4 space-y-2">
          {(data?.outboundEmails ?? []).length === 0 ? (
            <p className="text-sm text-muted">Aucun e-mail encore enregistré.</p>
          ) : null}
          {(data?.outboundEmails ?? []).map((e: any) => (
            <div key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line px-3 py-2 text-sm">
              <div className="min-w-0">
                <div className="font-semibold">{e.subject}</div>
                <div className="truncate text-muted">
                  {e.to} · {new Date(e.createdAt).toLocaleString("fr-FR")}
                </div>
              </div>
              <Badge
                tone={
                  e.status === "sent"
                    ? "green"
                    : e.status === "failed" || e.status === "skipped_quota"
                      ? "red"
                      : "neutral"
                }
              >
                {STATUS_LABEL[e.status] ?? e.status}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

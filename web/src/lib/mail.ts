import type { DB, OutboundEmail, Settings } from "./types";

export const PRO_EMAIL_DAILY_LIMIT_DEFAULT = 100;

export type MailProviderStatus = {
  enabled: boolean;
  configured: boolean;
  from: string | null;
  provider: "resend" | "none";
  dailyLimit: number;
};

function dayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function withMailSettings(settings: Settings): Settings {
  return {
    ...settings,
    proEmailDailyLimit: settings.proEmailDailyLimit ?? PRO_EMAIL_DAILY_LIMIT_DEFAULT,
  };
}

export function getMailProviderStatus(settings?: Settings): MailProviderStatus {
  const from = process.env.APPO_MAIL_FROM?.trim() || null;
  const resendKey = process.env.APPO_RESEND_API_KEY?.trim() || "";
  const enabledFlag = process.env.APPO_MAIL_ENABLED === "1" || process.env.APPO_MAIL_ENABLED === "true";
  const configured = Boolean(from && resendKey);
  return {
    enabled: enabledFlag && configured,
    configured,
    from,
    provider: resendKey ? "resend" : "none",
    dailyLimit: settings?.proEmailDailyLimit ?? PRO_EMAIL_DAILY_LIMIT_DEFAULT,
  };
}

export function countProEmailsToday(db: DB, day = dayKey()) {
  return (db.outboundEmails ?? []).filter(
    (e) => e.audience === "pro" && e.day === day && (e.status === "sent" || e.status === "queued"),
  ).length;
}

export function mailQuotaSnapshot(db: DB) {
  const settings = withMailSettings(db.settings);
  const day = dayKey();
  const used = countProEmailsToday(db, day);
  const limit = settings.proEmailDailyLimit;
  const provider = getMailProviderStatus(settings);
  return {
    day,
    used,
    limit,
    remaining: Math.max(0, limit - used),
    provider,
  };
}

function trimLog(db: DB) {
  if (!db.outboundEmails) db.outboundEmails = [];
  if (db.outboundEmails.length > 500) {
    db.outboundEmails = db.outboundEmails.slice(0, 500);
  }
}

function appBaseUrl() {
  return (process.env.APPO_PUBLIC_URL || process.env.RAILWAY_PUBLIC_DOMAIN
    ? process.env.APPO_PUBLIC_URL || `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : "https://appo-production-10fb.up.railway.app"
  ).replace(/\/$/, "");
}

async function sendViaResend(to: string, subject: string, text: string, href?: string) {
  const key = process.env.APPO_RESEND_API_KEY!.trim();
  const from = process.env.APPO_MAIL_FROM!.trim();
  const link = href ? `${appBaseUrl()}${href.startsWith("/") ? href : `/${href}`}` : appBaseUrl();
  const html = `<p>${text.replace(/\n/g, "<br/>")}</p>${href ? `<p><a href="${link}">Ouvrir dans AppO</a></p>` : ""}`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `[AppO] ${subject}`,
      text: `${text}${href ? `\n\n${link}` : ""}`,
      html,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`RESEND_${res.status}:${body.slice(0, 200)}`);
  }
}

/**
 * File d'attente e-mails pros — plafond 100/jour.
 * Tant que le compte mail n'est pas ouvert (APPO_MAIL_ENABLED + Resend),
 * les envois restent en statut pending_account.
 */
export function enqueueProEmail(
  db: DB,
  userId: string,
  subject: string,
  body: string,
  href?: string,
): OutboundEmail | null {
  const user = db.users.find((u) => u.id === userId);
  if (!user || user.role !== "pro" || user.deletedAt || user.suspended) return null;
  if (!user.email || user.email.includes("@anon.appo.local")) return null;

  db.settings = withMailSettings(db.settings);
  if (!db.outboundEmails) db.outboundEmails = [];

  const day = dayKey();
  const used = countProEmailsToday(db, day);
  const limit = db.settings.proEmailDailyLimit;
  const provider = getMailProviderStatus(db.settings);

  let status: OutboundEmail["status"] = "pending_account";
  if (!provider.enabled) {
    status = provider.configured ? "pending_account" : "pending_account";
  } else if (used >= limit) {
    status = "skipped_quota";
  } else {
    status = "queued";
  }

  const entry: OutboundEmail = {
    id: `mail_${Math.random().toString(36).slice(2, 10)}`,
    audience: "pro",
    userId: user.id,
    to: user.email,
    subject,
    body,
    href,
    status,
    day,
    createdAt: new Date().toISOString(),
    sentAt: null,
    error: null,
  };
  db.outboundEmails.unshift(entry);
  trimLog(db);
  return entry;
}

/** Envoie les e-mails `queued` (sous plafond). No-op si compte mail fermé. */
export async function flushProEmailQueue(db: DB): Promise<{ sent: number; failed: number; skipped: number }> {
  const provider = getMailProviderStatus(withMailSettings(db.settings));
  if (!provider.enabled) return { sent: 0, failed: 0, skipped: 0 };
  if (!db.outboundEmails) db.outboundEmails = [];

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  const day = dayKey();

  for (const entry of db.outboundEmails) {
    if (entry.audience !== "pro" || entry.status !== "queued") continue;
    const used = countProEmailsToday(db, day);
    // queued counts toward used — adjust by treating this one as about to send
    const othersQueuedOrSent = (db.outboundEmails ?? []).filter(
      (e) =>
        e.audience === "pro" &&
        e.day === day &&
        e.id !== entry.id &&
        (e.status === "sent" || e.status === "queued"),
    ).length;
    if (othersQueuedOrSent >= provider.dailyLimit) {
      entry.status = "skipped_quota";
      skipped += 1;
      continue;
    }
    try {
      await sendViaResend(entry.to, entry.subject, entry.body, entry.href);
      entry.status = "sent";
      entry.sentAt = new Date().toISOString();
      entry.error = null;
      sent += 1;
    } catch (e) {
      entry.status = "failed";
      entry.error = e instanceof Error ? e.message : "SEND_FAILED";
      failed += 1;
    }
  }
  return { sent, failed, skipped };
}

/** Après ouverture du compte : bascule pending_account du jour en queued (dans la limite). */
export function promotePendingProEmails(db: DB) {
  db.settings = withMailSettings(db.settings);
  if (!db.outboundEmails) db.outboundEmails = [];
  const provider = getMailProviderStatus(db.settings);
  if (!provider.enabled) return { promoted: 0 };
  const day = dayKey();
  let promoted = 0;
  for (const entry of db.outboundEmails) {
    if (entry.audience !== "pro" || entry.status !== "pending_account" || entry.day !== day) continue;
    if (countProEmailsToday(db, day) >= provider.dailyLimit) {
      entry.status = "skipped_quota";
      continue;
    }
    entry.status = "queued";
    promoted += 1;
  }
  return { promoted };
}

import nodemailer from "nodemailer";
import type { DB, OutboundEmail, Settings } from "./types";

export const PRO_EMAIL_DAILY_LIMIT_DEFAULT = 100;

export type MailProviderKind = "resend" | "brevo" | "gmail" | "smtp" | "none";

export type MailProviderStatus = {
  enabled: boolean;
  configured: boolean;
  from: string | null;
  provider: MailProviderKind;
  dailyLimit: number;
  /** Railway Hobby/Trial blocks outbound SMTP — HTTPS APIs required. */
  smtpLikelyBlocked: boolean;
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

function mailFrom() {
  return (
    process.env.APPO_MAIL_FROM?.trim() ||
    "AppO <contact@appo-ad.com>"
  );
}

function smtpConfigured() {
  const user = process.env.APPO_SMTP_USER?.trim() || "";
  // Match sendViaSmtp: Google app passwords are often pasted with spaces
  const pass = (process.env.APPO_SMTP_PASS || "").replace(/\s+/g, "");
  return Boolean(user && pass);
}

function resendConfigured() {
  return Boolean(process.env.APPO_RESEND_API_KEY?.trim());
}

function brevoConfigured() {
  return Boolean(
    process.env.APPO_BREVO_API_KEY?.trim() || process.env.BREVO_API_KEY?.trim(),
  );
}

function brevoApiKey() {
  return (process.env.APPO_BREVO_API_KEY || process.env.BREVO_API_KEY || "").trim();
}

/**
 * Prefer HTTPS APIs (Resend / Brevo) over SMTP.
 * Railway Free/Trial/Hobby blocks outbound SMTP (465/587) — connection timeouts.
 */
function detectProvider(): MailProviderKind {
  if (resendConfigured()) return "resend";
  if (brevoConfigured()) return "brevo";
  if (smtpConfigured()) {
    const host = (process.env.APPO_SMTP_HOST?.trim() || "smtp.gmail.com").toLowerCase();
    return host.includes("gmail") || host.includes("google") ? "gmail" : "smtp";
  }
  return "none";
}

export function getMailProviderStatus(settings?: Settings): MailProviderStatus {
  const from = mailFrom();
  const provider = detectProvider();
  const enabledFlag = process.env.APPO_MAIL_ENABLED === "1" || process.env.APPO_MAIL_ENABLED === "true";
  const configured = provider !== "none";
  return {
    enabled: enabledFlag && configured,
    configured,
    from,
    provider,
    dailyLimit: settings?.proEmailDailyLimit ?? PRO_EMAIL_DAILY_LIMIT_DEFAULT,
    // Hint for admin UI / health: SMTP alone will fail on Railway Hobby
    smtpLikelyBlocked: smtpConfigured() && !resendConfigured() && !brevoConfigured(),
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
    : "https://appo-ad.com"
  ).replace(/\/$/, "");
}

function buildBodies(text: string, href?: string) {
  const link = href ? `${appBaseUrl()}${href.startsWith("/") ? href : `/${href}`}` : appBaseUrl();
  const html = `<p>${text.replace(/\n/g, "<br/>")}</p>${href ? `<p><a href="${link}">Ouvrir dans AppO</a></p>` : ""}`;
  const plain = `${text}${href ? `\n\n${link}` : ""}`;
  return { html, plain, link };
}

async function sendViaResend(to: string, subject: string, text: string, href?: string) {
  const key = process.env.APPO_RESEND_API_KEY!.trim();
  const from = mailFrom();
  const { html, plain } = buildBodies(text, href);
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
      text: plain,
      html,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`RESEND_${res.status}:${body.slice(0, 200)}`);
  }
}

/** Brevo (Sendinblue) transactional HTTP API — works on Railway Hobby (HTTPS). */
async function sendViaBrevo(to: string, subject: string, text: string, href?: string) {
  const key = brevoApiKey();
  const fromRaw = mailFrom();
  const fromMatch = fromRaw.match(/^(.*?)\s*<([^>]+)>$/);
  const sender = fromMatch
    ? { name: fromMatch[1].trim().replace(/^"|"$/g, ""), email: fromMatch[2].trim() }
    : { name: "AppO", email: fromRaw };
  const { html, plain } = buildBodies(text, href);
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": key,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender,
      to: [{ email: to }],
      subject: `[AppO] ${subject}`,
      htmlContent: html,
      textContent: plain,
      replyTo: {
        email: process.env.APPO_MAIL_REPLY_TO?.trim() || "contact@appo-ad.com",
      },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`BREVO_${res.status}:${body.slice(0, 200)}`);
  }
}

/** Gmail / Google Workspace (smtp.gmail.com) or any SMTP via APPO_SMTP_*. */
async function sendViaSmtp(to: string, subject: string, text: string, href?: string) {
  const user = process.env.APPO_SMTP_USER!.trim();
  // App passwords are often pasted with spaces (xxxx xxxx xxxx xxxx)
  const pass = (process.env.APPO_SMTP_PASS || "").replace(/\s+/g, "");
  const host = process.env.APPO_SMTP_HOST?.trim() || "smtp.gmail.com";
  const port = Number(process.env.APPO_SMTP_PORT || "465");
  const secure = process.env.APPO_SMTP_SECURE === "false" ? false : port === 465;
  const from = mailFrom();
  const { html, plain } = buildBodies(text, href);

  const transport = nodemailer.createTransport({
    host,
    port,
    secure,
    connectionTimeout: 12_000,
    greetingTimeout: 12_000,
    socketTimeout: 20_000,
    auth: { user, pass },
  });

  try {
    await transport.sendMail({
      from,
      to,
      subject: `[AppO] ${subject}`,
      text: plain,
      html,
      replyTo: process.env.APPO_MAIL_REPLY_TO?.trim() || "contact@appo-ad.com",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // Railway Hobby/Trial: outbound SMTP is firewalled → Connection timeout
    if (/timeout|ETIMEDOUT|ECONNREFUSED|ENETUNREACH/i.test(msg)) {
      throw new Error(
        `SMTP_BLOCKED:${msg}. Railway Hobby blocks outbound SMTP — set APPO_RESEND_API_KEY or APPO_BREVO_API_KEY (HTTPS).`,
      );
    }
    throw e;
  }
}

async function sendOutbound(to: string, subject: string, text: string, href?: string) {
  const kind = detectProvider();
  if (kind === "resend") return sendViaResend(to, subject, text, href);
  if (kind === "brevo") return sendViaBrevo(to, subject, text, href);
  if (kind === "gmail" || kind === "smtp") return sendViaSmtp(to, subject, text, href);
  throw new Error("MAIL_NOT_CONFIGURED");
}

/**
 * Immediate transactional mail (login alert, etc.) — does not use the pro daily quota.
 * Returns without throwing when mail is disabled; throws only on provider send failure
 * when the caller wants to log it.
 */
export async function sendTransactionalEmail(input: {
  to: string;
  subject: string;
  text: string;
  href?: string;
}) {
  const provider = getMailProviderStatus();
  if (!provider.enabled) return { sent: false as const, reason: "mail_off" as const };
  const to = String(input.to || "").trim();
  if (!to || to.includes("@anon.appo.local")) {
    return { sent: false as const, reason: "no_email" as const };
  }
  await sendOutbound(to, input.subject, input.text, input.href);
  return { sent: true as const };
}

/** Security notice sent after every successful web login. */
export async function sendLoginConfirmationEmail(user: {
  id: string;
  email: string;
  firstName: string;
  role: string;
}) {
  const when = new Date().toLocaleString("fr-FR", {
    timeZone: "Europe/Paris",
    dateStyle: "long",
    timeStyle: "short",
  });
  const href = user.role === "pro" ? "/pro" : user.role === "admin" ? "/admin" : "/app";
  const subject = "Connexion à votre compte AppO";
  const text = [
    `Bonjour ${user.firstName || ""},`.trim() + ",",
    "",
    `Une connexion à votre compte AppO vient d’être effectuée le ${when} (heure de Paris).`,
    "",
    "Si c’était vous, vous pouvez ignorer ce message.",
    "Si ce n’était pas vous, changez immédiatement votre mot de passe et contactez-nous à contact@appo-ad.com.",
    "",
    "— L’équipe AppO",
  ].join("\n");

  return sendTransactionalEmail({ to: user.email, subject, text, href });
}

/**
 * File d'attente e-mails pros — plafond 100/jour.
 * Tant que le compte mail n'est pas ouvert (APPO_MAIL_ENABLED + SMTP/Resend),
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
    status = "pending_account";
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
      await sendOutbound(entry.to, entry.subject, entry.body, entry.href);
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

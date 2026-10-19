import { NextResponse } from "next/server";
import { setSession } from "@/lib/auth";
import { errorStatus, login } from "@/lib/actions";
import { mutate } from "@/lib/db";
import { log } from "@/lib/logger";
import { sendLoginConfirmationEmail } from "@/lib/mail";
import { pruneRateLimits, rateLimit } from "@/lib/rate-limit";

async function logLoginEmail(
  userId: string,
  to: string,
  result: { sent: boolean; reason?: string },
  error?: string,
) {
  try {
    await mutate((db) => {
      if (!db.outboundEmails) db.outboundEmails = [];
      db.outboundEmails.unshift({
        id: `mail_${Math.random().toString(36).slice(2, 10)}`,
        audience: "auth",
        userId,
        to,
        subject: "Connexion à votre compte AppO",
        body: "Alerte de connexion web",
        href: "/app",
        status: result.sent ? "sent" : error ? "failed" : "pending_account",
        day: new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString(),
        sentAt: result.sent ? new Date().toISOString() : null,
        error: error || (result.sent ? null : result.reason || null),
      });
      if (db.outboundEmails.length > 500) db.outboundEmails = db.outboundEmails.slice(0, 500);
    });
  } catch {
    /* never block login on log failure */
  }
}

export async function POST(req: Request) {
  try {
    pruneRateLimits();
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    const rl = rateLimit(`login:${ip}`, 20, 15 * 60 * 1000);
    if (!rl.ok) {
      log("warn", "login_rate_limited", { ip });
      return NextResponse.json(
        { error: "RATE_LIMITED" },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
      );
    }
    const body = await req.json();
    const email = String(body.email ?? "");
    const user = await login(email, String(body.password ?? ""));
    await setSession(user.id, user.role);
    log("info", "login_ok", { userId: user.id, role: user.role });

    // Await send so the Node process cannot exit before SMTP completes.
    // Never fail the login response if mail fails.
    try {
      const result = await sendLoginConfirmationEmail({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        role: user.role,
      });
      await logLoginEmail(user.id, user.email, result);
      log(result.sent ? "info" : "warn", "login_email", {
        userId: user.id,
        to: user.email,
        sent: result.sent,
        reason: "reason" in result ? result.reason : undefined,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "SEND_FAILED";
      await logLoginEmail(user.id, user.email, { sent: false }, message);
      log("warn", "login_email_failed", { userId: user.id, to: user.email, error: message });
    }

    return NextResponse.json({ user });
  } catch (e) {
    const { status, error } = errorStatus(e);
    log("warn", "login_failed", { error });
    return NextResponse.json({ error }, { status });
  }
}

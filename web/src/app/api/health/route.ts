import { NextResponse } from "next/server";
import { assertSecretConfigured, secretMode } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { persistenceStatus } from "@/lib/paths";
import { pgHealth } from "@/lib/pg";
import { isStripeEnabled, stripeMode } from "@/lib/stripe";
import { getMailProviderStatus } from "@/lib/mail";
import { launchSnapshot } from "@/lib/launch";

export async function GET() {
  const started = Date.now();
  try {
    assertSecretConfigured();
    const [db, persistence, database] = await Promise.all([
      readDb(),
      persistenceStatus(),
      pgHealth(),
    ]);
    const ready = persistence.writable && database.ok;
    const mail = getMailProviderStatus(db.settings);
    const launch = launchSnapshot();
    return NextResponse.json({
      ok: true,
      status: ready ? "ready" : "degraded",
      uptimeSec: Math.round(process.uptime()),
      users: db.users.length,
      missions: db.missions.length,
      requests: db.requests?.length ?? 0,
      latencyMs: Date.now() - started,
      node: process.version,
      env: process.env.NODE_ENV,
      secretMode: secretMode(),
      launch,
      stripe: {
        enabled: isStripeEnabled(),
        mode: stripeMode(),
        webhook: Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim()),
      },
      mail: {
        enabled: mail.enabled,
        configured: mail.configured,
        provider: mail.provider,
        from: mail.from,
        smtpLikelyBlocked: mail.smtpLikelyBlocked,
      },
      persistence,
      database,
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        status: "error",
        error: e instanceof Error ? e.message : "ERROR",
      },
      { status: 503 },
    );
  }
}

import { NextResponse } from "next/server";
import { assertSecretConfigured, secretMode } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { persistenceStatus } from "@/lib/paths";
import { pgHealth } from "@/lib/pg";

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

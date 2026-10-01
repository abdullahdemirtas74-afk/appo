/**
 * Fondation Postgres — activée uniquement si DATABASE_URL est défini.
 * Tant que l’URL est absente, AppO continue sur db.json (comportement actuel).
 */

import { logEvent } from "./monitoring";

let pool: import("pg").Pool | null = null;

export function isPostgresEnabled() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export async function getPgPool() {
  if (!isPostgresEnabled()) return null;
  if (pool) return pool;
  try {
    const { Pool } = await import("pg");
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL === "disable" ? undefined : { rejectUnauthorized: false },
      max: 5,
    });
    pool.on("error", (err) => logEvent("pg_pool_error", { message: err.message }, "error"));
    logEvent("pg_pool_ready");
    return pool;
  } catch (e) {
    logEvent(
      "pg_unavailable",
      { message: e instanceof Error ? e.message : String(e) },
      "warning",
    );
    return null;
  }
}

export async function pgHealth(): Promise<{ ok: boolean; mode: "postgres" | "json"; latencyMs?: number }> {
  if (!isPostgresEnabled()) return { ok: true, mode: "json" };
  const p = await getPgPool();
  if (!p) return { ok: false, mode: "postgres" };
  const t0 = Date.now();
  try {
    await p.query("select 1 as ok");
    return { ok: true, mode: "postgres", latencyMs: Date.now() - t0 };
  } catch (e) {
    logEvent("pg_health_failed", { message: e instanceof Error ? e.message : String(e) }, "error");
    return { ok: false, mode: "postgres", latencyMs: Date.now() - t0 };
  }
}

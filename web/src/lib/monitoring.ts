/**
 * Monitoring léger — logs structurés JSON (stdout) pour Railway.
 * Sentry : définir SENTRY_DSN et installer `@sentry/nextjs`, puis brancher
 * captureException/init dans ce module (évite une dépendance obligatoire au build).
 */

type Severity = "info" | "warning" | "error" | "fatal";

export function logEvent(
  event: string,
  fields: Record<string, unknown> = {},
  level: Severity = "info",
) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    event,
    ...fields,
  };
  const line = JSON.stringify(payload);
  if (level === "error" || level === "fatal") console.error(line);
  else if (level === "warning") console.warn(line);
  else console.log(line);
}

export function captureError(error: unknown, context: Record<string, unknown> = {}) {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  logEvent("app_error", { message, stack, ...context }, "error");
}

export function initMonitoring() {
  if (typeof window !== "undefined") return;
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (dsn) {
    logEvent("monitoring_sentry_dsn_set", {
      hint: "Install @sentry/nextjs and wire init in instrumentation.ts for full Sentry",
    });
  } else {
    logEvent("monitoring_stdout_only", { hint: "Set SENTRY_DSN to enable Sentry later" });
  }
}

import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { log } from "./logger";
import type { Role } from "./types";

const DEFAULT_SECRET = "appo-local-dev-secret-v1";
const COOKIE = "appo_session";

function resolveSecret(): { value: string; mode: "env" | "derived" | "dev" } {
  const fromEnv = process.env.APPO_SECRET?.trim();
  if (fromEnv && fromEnv !== DEFAULT_SECRET && fromEnv.length >= 24) {
    return { value: fromEnv, mode: "env" };
  }
  if (process.env.NODE_ENV === "production") {
    const seed =
      process.env.RAILWAY_PROJECT_ID ||
      process.env.RAILWAY_SERVICE_ID ||
      process.env.HOSTNAME ||
      "appo-prod";
    const value = createHmac("sha256", "appo-prod-derivation-v1").update(seed).digest("hex");
    return { value, mode: "derived" };
  }
  return { value: DEFAULT_SECRET, mode: "dev" };
}

let cached: { value: string; mode: "env" | "derived" | "dev" } | null = null;
function secret() {
  if (!cached) {
    cached = resolveSecret();
    if (cached.mode === "derived") {
      log("warn", "appo_secret_derived", {
        hint: "Set APPO_SECRET (>=24 chars) for stronger session security",
      });
    }
  }
  return cached.value;
}

export function secretMode() {
  if (!cached) cached = resolveSecret();
  return cached.mode;
}

/** Shared secret material for session HMAC and PII encryption */
export function getAppSecret() {
  return secret();
}

/** Call at boot / health */
export function assertSecretConfigured() {
  secret();
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const next = scryptSync(password, salt, 32);
  const prev = Buffer.from(hash, "hex");
  if (next.length !== prev.length) return false;
  return timingSafeEqual(next, prev);
}

type Session = { userId: string; role: Role; exp: number };

function sign(payload: Session) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function unsign(token: string): Session | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  try {
    const expected = createHmac("sha256", secret()).update(body).digest("base64url");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const session = JSON.parse(Buffer.from(body, "base64url").toString()) as Session;
    if (session.exp < Date.now()) return null;
    return session;
  } catch (e) {
    log("warn", "session_unsign_failed", { error: e instanceof Error ? e.message : "err" });
    return null;
  }
}

export async function setSession(userId: string, role: Role) {
  const token = sign({
    userId,
    role,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });
  const store = await cookies();
  const secure = process.env.NODE_ENV === "production";
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  return unsign(token);
}

export { COOKIE as SESSION_COOKIE };

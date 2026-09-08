import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { getAppSecret } from "./auth";

const PREFIX = "enc:v1:";

function key() {
  return createHash("sha256").update(`appo-pii-v1:${getAppSecret()}`).digest();
}

/** Encrypt sensitive string at rest (AES-256-GCM). Idempotent if already sealed. */
export function sealPii(value: string | null | undefined): string {
  const plain = String(value ?? "");
  if (!plain) return "";
  if (plain.startsWith(PREFIX)) return plain;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64url")}:${tag.toString("base64url")}:${enc.toString("base64url")}`;
}

/** Decrypt sealed PII; returns plaintext unchanged if not sealed. */
export function openPii(value: string | null | undefined): string {
  const raw = String(value ?? "");
  if (!raw.startsWith(PREFIX)) return raw;
  try {
    const body = raw.slice(PREFIX.length);
    const [ivB64, tagB64, dataB64] = body.split(":");
    if (!ivB64 || !tagB64 || !dataB64) return "";
    const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(ivB64, "base64url"));
    decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(dataB64, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return "";
  }
}

export function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  if (!domain) return "***";
  const u = user.length <= 2 ? `${user[0] ?? "*"}*` : `${user.slice(0, 2)}***`;
  return `${u}@${domain}`;
}

export function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "•••";
  return `${digits.slice(0, 2)} •• •• •• ${digits.slice(-2)}`;
}

export function maskName(lastName: string) {
  if (!lastName) return "";
  return `${lastName.charAt(0).toUpperCase()}.`;
}

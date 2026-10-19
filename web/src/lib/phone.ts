/** Normalize / validate French phone numbers for registration. */

export function normalizePhone(raw: string): string {
  const trimmed = String(raw || "").trim();
  if (!trimmed) return "";
  // keep leading + then digits only
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";
  if (hasPlus) return `+${digits}`;
  // 0XXXXXXXXX → keep national format with spaces stripped
  return digits;
}

export function isValidPhone(raw: string): boolean {
  const n = normalizePhone(raw);
  if (!n) return false;
  const digits = n.replace(/\D/g, "");
  // FR mobile/landline 10 digits starting with 0, or +33… (11+ with country)
  if (digits.length === 10 && digits.startsWith("0")) return true;
  if (digits.length >= 11 && digits.length <= 15) return true;
  return false;
}

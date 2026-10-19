/** Normalize / validate phone numbers — FR-friendly, international OK. */

import { getMarket } from "./market";

export function normalizePhone(raw: string): string {
  const trimmed = String(raw || "").trim();
  if (!trimmed) return "";
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";
  if (hasPlus) return `+${digits}`;
  return digits;
}

export function isValidPhone(raw: string): boolean {
  const n = normalizePhone(raw);
  if (!n) return false;
  const digits = n.replace(/\D/g, "");
  const region = getMarket().phoneDefaultRegion;

  // International E.164-ish: 8–15 digits (with country code)
  if (n.startsWith("+") && digits.length >= 8 && digits.length <= 15) return true;

  if (region === "FR" || region === "CH" || !region) {
    // FR/CH national: 10 digits starting with 0
    if (digits.length === 10 && digits.startsWith("0")) return true;
  }
  // Generic national numbers 8–15 digits
  if (digits.length >= 8 && digits.length <= 15) return true;
  return false;
}

import { NextResponse } from "next/server";
import { errorStatus, resetPasswordWithToken } from "@/lib/actions";
import { log } from "@/lib/logger";
import { pruneRateLimits, rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    pruneRateLimits();
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    const rl = rateLimit(`reset:${ip}`, 10, 15 * 60 * 1000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "RATE_LIMITED" },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
      );
    }

    const body = await req.json().catch(() => ({}));
    const result = await resetPasswordWithToken(String(body.token ?? ""), String(body.password ?? ""));
    log("info", "password_reset_ok", { email: result.email });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const { status, error } = errorStatus(e);
    log("warn", "password_reset_failed", { error });
    return NextResponse.json({ error }, { status });
  }
}

import { NextResponse } from "next/server";
import { errorStatus, requestPasswordReset } from "@/lib/actions";
import { log } from "@/lib/logger";
import { pruneRateLimits, rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    pruneRateLimits();
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    const rl = rateLimit(`forgot:${ip}`, 8, 15 * 60 * 1000);
    if (!rl.ok) {
      log("warn", "forgot_password_rate_limited", { ip });
      return NextResponse.json(
        { error: "RATE_LIMITED" },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
      );
    }

    const body = await req.json().catch(() => ({}));
    const result = await requestPasswordReset(String(body.email ?? ""));
    log("info", "forgot_password_requested", { emailDomain: String(body.email ?? "").split("@")[1] || "" });
    return NextResponse.json(result);
  } catch (e) {
    const { status, error } = errorStatus(e);
    return NextResponse.json({ error }, { status });
  }
}

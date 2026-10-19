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
    const email = String(body.email ?? "");
    const phone = String(body.phone ?? "");
    const result = await requestPasswordReset(email, phone);
    log("info", "forgot_password_onsite_ok", {
      emailDomain: email.split("@")[1] || "",
    });
    return NextResponse.json(result);
  } catch (e) {
    const { status, error } = errorStatus(e);
    log("warn", "forgot_password_failed", { error });
    return NextResponse.json({ error }, { status });
  }
}

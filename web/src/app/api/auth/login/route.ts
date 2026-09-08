import { NextResponse } from "next/server";
import { setSession } from "@/lib/auth";
import { errorStatus, login } from "@/lib/actions";
import { log } from "@/lib/logger";
import { pruneRateLimits, rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    pruneRateLimits();
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    const rl = rateLimit(`login:${ip}`, 20, 15 * 60 * 1000);
    if (!rl.ok) {
      log("warn", "login_rate_limited", { ip });
      return NextResponse.json(
        { error: "RATE_LIMITED" },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
      );
    }
    const body = await req.json();
    const email = String(body.email ?? "");
    const user = await login(email, String(body.password ?? ""));
    await setSession(user.id, user.role);
    log("info", "login_ok", { userId: user.id, role: user.role });
    return NextResponse.json({ user });
  } catch (e) {
    const { status, error } = errorStatus(e);
    log("warn", "login_failed", { error });
    return NextResponse.json({ error }, { status });
  }
}

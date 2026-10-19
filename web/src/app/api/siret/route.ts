import { NextResponse } from "next/server";
import { lookupSiret } from "@/lib/siret";
import { pruneRateLimits, rateLimit } from "@/lib/rate-limit";

export async function GET(req: Request) {
  pruneRateLimits();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const rl = rateLimit(`siret:${ip}`, 20, 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const q = new URL(req.url).searchParams.get("q") || "";
  const result = await lookupSiret(q);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}

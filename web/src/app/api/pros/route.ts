import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { listPros } from "@/lib/actions";

export async function GET(req: Request) {
  const session = await getSession();
  const url = new URL(req.url);
  const pros = await listPros({
    userId: session?.userId,
    categoryId: url.searchParams.get("categoryId") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
    available: url.searchParams.get("available") === "1",
    minRating: url.searchParams.get("minRating") ? Number(url.searchParams.get("minRating")) : undefined,
    maxPrice: url.searchParams.get("maxPrice") ? Number(url.searchParams.get("maxPrice")) : undefined,
    maxKm: url.searchParams.get("maxKm") ? Number(url.searchParams.get("maxKm")) : undefined,
  });
  return NextResponse.json({ pros });
}

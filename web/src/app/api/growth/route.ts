import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { errorStatus } from "@/lib/actions";
import { growthAction, growthOverview } from "@/lib/growth-actions";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const data = await growthOverview(session.userId);
    return NextResponse.json(data);
  } catch (e) {
    const { status, error } = errorStatus(e);
    return NextResponse.json({ error }, { status });
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const body = await req.json();
    const result = await growthAction(session.userId, String(body.action ?? ""), body);
    return NextResponse.json(result);
  } catch (e) {
    const { status, error } = errorStatus(e);
    return NextResponse.json({ error }, { status });
  }
}

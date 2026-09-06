import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { errorStatus, proStats, updatePro } from "@/lib/actions";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const stats = await proStats(session.userId);
    return NextResponse.json(stats);
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
    const pro = await updatePro(session.userId, body);
    return NextResponse.json(pro);
  } catch (e) {
    const { status, error } = errorStatus(e);
    return NextResponse.json({ error }, { status });
  }
}

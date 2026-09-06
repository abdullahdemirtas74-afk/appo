import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createMission, errorStatus, listMissions } from "@/lib/actions";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const missions = await listMissions(session.userId);
    return NextResponse.json({ missions });
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
    const mission = await createMission(session.userId, body);
    return NextResponse.json({ mission });
  } catch (e) {
    const { status, error } = errorStatus(e);
    return NextResponse.json({ error }, { status });
  }
}

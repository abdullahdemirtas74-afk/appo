import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { errorStatus, getMission, missionAction } from "@/lib/actions";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const { id } = await ctx.params;
    const mission = await getMission(session.userId, id);
    return NextResponse.json({ mission });
  } catch (e) {
    const { status, error } = errorStatus(e);
    return NextResponse.json({ error }, { status });
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const mission = await missionAction(session.userId, id, String(body.action), body);
    return NextResponse.json({ mission });
  } catch (e) {
    const { status, error } = errorStatus(e);
    return NextResponse.json({ error }, { status });
  }
}

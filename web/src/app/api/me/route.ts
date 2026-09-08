import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { errorStatus, getMe, updateClientProfile } from "@/lib/actions";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null });
  try {
    const me = await getMe(session.userId);
    return NextResponse.json(me);
  } catch (e) {
    const { status, error } = errorStatus(e);
    return NextResponse.json({ error, user: null }, { status });
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const body = await req.json();
    const user = await updateClientProfile(session.userId, body);
    return NextResponse.json({ user });
  } catch (e) {
    const { status, error } = errorStatus(e);
    return NextResponse.json({ error }, { status });
  }
}

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { errorStatus, getMe } from "@/lib/actions";

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

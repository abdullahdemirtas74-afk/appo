import { NextResponse } from "next/server";
import { getSession, setSession } from "@/lib/auth";
import { errorStatus, login } from "@/lib/actions";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const user = await login(String(body.email ?? ""), String(body.password ?? ""));
    await setSession(user.id, user.role);
    return NextResponse.json({ user });
  } catch (e) {
    const { status, error } = errorStatus(e);
    return NextResponse.json({ error }, { status });
  }
}

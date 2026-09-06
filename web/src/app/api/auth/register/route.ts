import { NextResponse } from "next/server";
import { setSession } from "@/lib/auth";
import { errorStatus, registerClient, registerPro } from "@/lib/actions";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const user =
      body.role === "pro"
        ? await registerPro(body)
        : await registerClient(body);
    await setSession(user.id, user.role);
    return NextResponse.json({ user });
  } catch (e) {
    const { status, error } = errorStatus(e);
    return NextResponse.json({ error }, { status });
  }
}

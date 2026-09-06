import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { adminAction, adminLists, adminOverview, errorStatus } from "@/lib/actions";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  try {
    const [overview, lists] = await Promise.all([adminOverview(), adminLists()]);
    return NextResponse.json({ ...overview, ...lists });
  } catch (e) {
    const { status, error } = errorStatus(e);
    return NextResponse.json({ error }, { status });
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  try {
    const body = await req.json();
    const result = await adminAction(session.userId, String(body.action), body);
    return NextResponse.json({ result });
  } catch (e) {
    const { status, error } = errorStatus(e);
    return NextResponse.json({ error }, { status });
  }
}

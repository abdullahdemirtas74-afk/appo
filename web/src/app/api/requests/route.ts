import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { errorStatus } from "@/lib/actions";
import {
  createServiceRequest,
  listServiceRequests,
} from "@/lib/rfq-actions";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const requests = await listServiceRequests(session.userId);
    return NextResponse.json({ requests });
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
    const request = await createServiceRequest(session.userId, body);
    return NextResponse.json({ request });
  } catch (e) {
    const { status, error } = errorStatus(e);
    return NextResponse.json({ error }, { status });
  }
}

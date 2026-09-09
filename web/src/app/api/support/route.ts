import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { errorStatus } from "@/lib/actions";
import {
  createSupportTicket,
  getSupportItem,
  listMySupport,
  replySupport,
  submitProDocument,
  submitProVerification,
} from "@/lib/support-actions";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (id) {
      const item = await getSupportItem(session.userId, id);
      return NextResponse.json(item);
    }
    const list = await listMySupport(session.userId);
    return NextResponse.json(list);
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
    if (body.action === "createTicket") {
      const ticket = await createSupportTicket(session.userId, body);
      return NextResponse.json({ ticket });
    }
    if (body.action === "reply") {
      const result = await replySupport(session.userId, body);
      return NextResponse.json(result);
    }
    if (body.action === "submitDocument") {
      const result = await submitProDocument(session.userId, body);
      return NextResponse.json(result);
    }
    if (body.action === "submitVerification") {
      const result = await submitProVerification(session.userId);
      return NextResponse.json(result);
    }
    return NextResponse.json({ error: "UNKNOWN_ACTION" }, { status: 400 });
  } catch (e) {
    const { status, error } = errorStatus(e);
    return NextResponse.json({ error }, { status });
  }
}

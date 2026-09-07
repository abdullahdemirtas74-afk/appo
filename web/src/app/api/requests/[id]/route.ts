import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { errorStatus } from "@/lib/actions";
import {
  cancelServiceRequest,
  getServiceRequest,
  selectProOffer,
  submitProOffer,
} from "@/lib/rfq-actions";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const { id } = await ctx.params;
    const request = await getServiceRequest(session.userId, id);
    return NextResponse.json({ request });
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
    const action = String(body.action);
    if (action === "submitOffer") {
      const request = await submitProOffer(session.userId, id, body);
      return NextResponse.json({ request });
    }
    if (action === "selectOffer") {
      const result = await selectProOffer(session.userId, id, String(body.offerId));
      return NextResponse.json(result);
    }
    if (action === "cancel") {
      const request = await cancelServiceRequest(session.userId, id);
      return NextResponse.json({ request });
    }
    return NextResponse.json({ error: "UNKNOWN_ACTION" }, { status: 400 });
  } catch (e) {
    const { status, error } = errorStatus(e);
    return NextResponse.json({ error }, { status });
  }
}

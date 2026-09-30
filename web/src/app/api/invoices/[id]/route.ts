import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { errorStatus, getInvoice } from "@/lib/actions";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const { id } = await ctx.params;
    const data = await getInvoice(session.userId, id);
    return NextResponse.json(data);
  } catch (e) {
    const { status, error } = errorStatus(e);
    return NextResponse.json({ error }, { status });
  }
}

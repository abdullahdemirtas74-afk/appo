import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { errorStatus, listInvoices } from "@/lib/actions";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const data = await listInvoices(session.userId);
    return NextResponse.json(data);
  } catch (e) {
    const { status, error } = errorStatus(e);
    return NextResponse.json({ error }, { status });
  }
}

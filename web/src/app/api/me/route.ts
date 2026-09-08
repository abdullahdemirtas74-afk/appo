import { NextResponse } from "next/server";
import { clearSession, getSession } from "@/lib/auth";
import {
  addClientAddress,
  deleteMyAccount,
  errorStatus,
  exportPersonalData,
  getMe,
  markNotificationsRead,
  setDefaultAddress,
  subscribeClientPlus,
  updateClientProfile,
} from "@/lib/actions";

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
    if (body.action === "subscribePlus") {
      const result = await subscribeClientPlus(session.userId, body.plan === "yearly" ? "yearly" : "monthly");
      return NextResponse.json(result);
    }
    if (body.action === "markNotificationsRead") {
      const result = await markNotificationsRead(session.userId, body.ids);
      return NextResponse.json(result);
    }
    if (body.action === "setDefaultAddress") {
      const addresses = await setDefaultAddress(session.userId, String(body.addressId));
      return NextResponse.json({ addresses });
    }
    if (body.action === "addAddress") {
      const addresses = await addClientAddress(session.userId, body);
      return NextResponse.json({ addresses });
    }
    if (body.action === "exportMyData") {
      const data = await exportPersonalData(session.userId);
      return NextResponse.json(data);
    }
    if (body.action === "deleteAccount") {
      const result = await deleteMyAccount(session.userId, String(body.confirm ?? ""));
      await clearSession();
      return NextResponse.json(result);
    }
    const user = await updateClientProfile(session.userId, body);
    return NextResponse.json({ user });
  } catch (e) {
    const { status, error } = errorStatus(e);
    return NextResponse.json({ error }, { status });
  }
}

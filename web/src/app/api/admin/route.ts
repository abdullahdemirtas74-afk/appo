import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { adminAction, adminLists, adminOverview, errorStatus } from "@/lib/actions";
import { log } from "@/lib/logger";
import { mutate, requireUser } from "@/lib/db";

async function assertAdmin(userId: string) {
  return mutate((db) => requireUser(db, userId, "admin"), false);
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    await assertAdmin(session.userId);
    const url = new URL(req.url);
    if (url.searchParams.get("export") === "1") {
      const result = await adminAction(session.userId, "exportBackup", {});
      log("info", "admin_export", { userId: session.userId });
      return NextResponse.json(result, {
        headers: {
          "Content-Disposition": `attachment; filename="appo-backup-${new Date().toISOString().slice(0, 10)}.json"`,
        },
      });
    }
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
  try {
    await assertAdmin(session.userId);
    const body = await req.json();
    const action = String(body.action);
    const result = await adminAction(session.userId, action, body);
    log("info", "admin_action", { userId: session.userId, action });
    return NextResponse.json({ result });
  } catch (e) {
    const { status, error } = errorStatus(e);
    log("warn", "admin_action_failed", { error });
    return NextResponse.json({ error }, { status });
  }
}

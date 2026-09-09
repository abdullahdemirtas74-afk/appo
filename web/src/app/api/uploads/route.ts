import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { errorStatus } from "@/lib/actions";
import { saveUploadFile } from "@/lib/uploads";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new Error("FILE_REQUIRED");
    const buf = Buffer.from(await file.arrayBuffer());
    const mime = file.type || "application/octet-stream";
    const saved = await saveUploadFile({
      userId: session.userId,
      buffer: buf,
      mime,
      originalName: file.name,
    });
    return NextResponse.json(saved);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ERROR";
    const map: Record<string, number> = {
      UNAUTHORIZED: 401,
      INVALID_FILE_TYPE: 400,
      FILE_TOO_LARGE: 400,
      INVALID_FILE: 400,
      FILE_REQUIRED: 400,
    };
    return NextResponse.json({ error: msg }, { status: map[msg] ?? errorStatus(e).status });
  }
}

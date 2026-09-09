import { createHash, randomBytes } from "crypto";
import fs from "fs/promises";
import path from "path";
import { ensureDataDirs, uploadsDir } from "./paths";

const MAX_IMAGE = 5 * 1024 * 1024;
const MAX_DOC = 8 * 1024 * 1024;

const ALLOWED: Record<string, { ext: string; max: number }> = {
  "image/jpeg": { ext: "jpg", max: MAX_IMAGE },
  "image/png": { ext: "png", max: MAX_IMAGE },
  "image/webp": { ext: "webp", max: MAX_IMAGE },
  "application/pdf": { ext: "pdf", max: MAX_DOC },
};

export function isAllowedUploadMime(mime: string) {
  return Boolean(ALLOWED[mime]);
}

export async function saveUploadFile(opts: {
  userId: string;
  buffer: Buffer;
  mime: string;
  originalName?: string;
}) {
  const rule = ALLOWED[opts.mime];
  if (!rule) throw new Error("INVALID_FILE_TYPE");
  if (opts.buffer.length > rule.max) throw new Error("FILE_TOO_LARGE");
  if (opts.buffer.length < 12) throw new Error("INVALID_FILE");

  await ensureDataDirs();
  const userDir = path.join(uploadsDir(), opts.userId);
  await fs.mkdir(userDir, { recursive: true });
  const id = `${Date.now().toString(36)}_${randomBytes(4).toString("hex")}`;
  const filename = `${id}.${rule.ext}`;
  const abs = path.join(userDir, filename);
  await fs.writeFile(abs, opts.buffer);
  const url = `/api/uploads/${opts.userId}/${filename}`;
  return {
    url,
    name: opts.originalName?.slice(0, 120) || filename,
    mime: opts.mime,
    size: opts.buffer.length,
    sha256: createHash("sha256").update(opts.buffer).digest("hex").slice(0, 16),
  };
}

/** Resolve a stored upload URL to absolute path; rejects path traversal. */
export function resolveUploadPath(userId: string, filename: string) {
  if (!/^[a-zA-Z0-9_-]+$/.test(userId)) return null;
  if (!/^[a-zA-Z0-9._-]+$/.test(filename)) return null;
  const abs = path.join(uploadsDir(), userId, filename);
  const root = path.join(uploadsDir(), userId);
  if (!abs.startsWith(root)) return null;
  return abs;
}

export function isStoredUploadUrl(url: string) {
  return typeof url === "string" && (url.startsWith("/api/uploads/") || url.startsWith("https://"));
}

export function normalizePhotoUrls(photos: string[] | undefined, max = 6) {
  const list = (photos ?? [])
    .filter((p) => typeof p === "string" && p.length > 0)
    .filter((p) => {
      if (p.startsWith("data:")) return p.length < 80_000; // legacy small only
      if (p.startsWith("/api/uploads/")) return true;
      if (p.startsWith("https://")) return true;
      return false;
    })
    .slice(0, max);
  return list;
}

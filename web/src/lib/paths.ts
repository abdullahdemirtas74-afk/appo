import fs from "fs/promises";
import path from "path";

/** Root for db.json, backups, uploads. On Railway set DATA_DIR=/data + volume. */
export function dataRoot() {
  return process.env.DATA_DIR?.trim() || path.join(process.cwd(), "data");
}

export function dbPath() {
  return path.join(dataRoot(), "db.json");
}

export function backupDir() {
  return path.join(dataRoot(), "backups");
}

export function uploadsDir() {
  return path.join(dataRoot(), "uploads");
}

export async function ensureDataDirs() {
  await fs.mkdir(dataRoot(), { recursive: true });
  await fs.mkdir(backupDir(), { recursive: true });
  await fs.mkdir(uploadsDir(), { recursive: true });
}

export async function persistenceStatus() {
  const root = dataRoot();
  const db = dbPath();
  let dbExists = false;
  let writable = false;
  let backupCount = 0;
  let uploadCount = 0;
  try {
    await ensureDataDirs();
    await fs.access(root);
    try {
      await fs.access(db);
      dbExists = true;
    } catch {
      dbExists = false;
    }
    const probe = path.join(root, `.write-probe-${process.pid}`);
    await fs.writeFile(probe, "ok", "utf8");
    await fs.unlink(probe);
    writable = true;
    try {
      backupCount = (await fs.readdir(backupDir())).filter((f) => f.endsWith(".json")).length;
    } catch {
      backupCount = 0;
    }
    try {
      const walk = async (dir: string): Promise<number> => {
        let n = 0;
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const e of entries) {
          if (e.isDirectory()) n += await walk(path.join(dir, e.name));
          else n += 1;
        }
        return n;
      };
      uploadCount = await walk(uploadsDir());
    } catch {
      uploadCount = 0;
    }
  } catch {
    writable = false;
  }
  const configured = Boolean(process.env.DATA_DIR?.trim());
  return {
    dataDir: root,
    dbPath: db,
    dataDirConfigured: configured,
    volumeHint: configured ? "DATA_DIR set — mount a Railway volume at this path" : "Using ./data (ephemeral on redeploy without volume)",
    dbExists,
    writable,
    backupCount,
    uploadCount,
  };
}

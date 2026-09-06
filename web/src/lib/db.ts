import fs from "fs/promises";
import path from "path";
import {
  availabilitySnapshot,
  busyProIds,
  canReceiveNowOffer,
  normalizePro,
} from "./availability";
import { haversineKm, interpolate } from "./geo";
import { createSeed } from "./seed";
import type {
  DB,
  Mission,
  MissionStatus,
  ProProfile,
  PublicUser,
  Role,
  User,
} from "./types";

const DB_PATH = path.join(process.cwd(), "data", "db.json");

let chain: Promise<unknown> = Promise.resolve();

function migrate(db: DB): DB {
  db.pros = db.pros.map(normalizePro);
  if (!db.settings.offerSeconds) db.settings.offerSeconds = 20;
  if (db.settings.commissionRate == null) db.settings.commissionRate = 0.15;
  return db;
}

async function readFile(): Promise<DB> {
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    return migrate(JSON.parse(raw) as DB);
  } catch {
    const seed = createSeed();
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    await fs.writeFile(DB_PATH, JSON.stringify(seed, null, 2), "utf8");
    return seed;
  }
}

async function writeFile(db: DB) {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

export function resetDb() {
  return mutate(async () => {
    const seed = createSeed();
    await writeFile(seed);
    return seed;
  });
}

export function readDb() {
  return mutate(async (db) => db, false);
}

export function mutate<T>(fn: (db: DB) => T | Promise<T>, persist = true) {
  const run = chain.then(async () => {
    const db = await readFile();
    processDispatch(db);
    const result = await fn(db);
    if (persist) await writeFile(db);
    return result;
  });
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function nid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function publicUser(user: User): PublicUser {
  const { passwordHash: _p, ...rest } = user;
  return rest;
}

export function matchPros(db: DB, categoryId: string, lat: number, lng: number) {
  return db.pros
    .filter(
      (p) =>
        p.verified &&
        p.status === "verified" &&
        p.categoryIds.includes(categoryId) &&
        canReceiveNowOffer(db, p),
    )
    .map((p) => ({
      pro: p,
      distance: haversineKm(lat, lng, p.lat, p.lng),
    }))
    .filter(({ pro, distance }) => distance <= pro.radiusKm)
    .sort(
      (a, b) =>
        a.distance - b.distance ||
        b.pro.rating - a.pro.rating ||
        b.pro.acceptanceRate - a.pro.acceptanceRate,
    );
}

export { busyProIds, availabilitySnapshot, normalizePro };

function notify(
  db: DB,
  userId: string,
  title: string,
  body: string,
  href?: string,
) {
  db.notifications.unshift({
    id: nid("ntf"),
    userId,
    title,
    body,
    read: false,
    href,
    createdAt: new Date().toISOString(),
  });
}

export function processDispatch(db: DB, now = Date.now()) {
  for (const m of db.missions) {
    if (m.type !== "now") continue;
    if (m.status !== "searching" && m.status !== "offered") continue;
    if (m.offerProId) {
      if (!m.offerExpiresAt) continue;
      if (new Date(m.offerExpiresAt).getTime() > now) continue;
      m.declinedProIds.push(m.offerProId);
      m.candidateProIds = m.candidateProIds.filter((id) => id !== m.offerProId);
      m.offerProId = null;
      m.offerExpiresAt = null;
    }
    const next = m.candidateProIds.find((id) => {
      if (m.declinedProIds.includes(id)) return false;
      const pro = db.pros.find((p) => p.id === id);
      return pro ? canReceiveNowOffer(db, pro, new Date(now)) : false;
    });
    if (!next) {
      m.status = "unmatched";
      notify(
        db,
        m.clientId,
        "Aucun professionnel disponible",
        "Essayez de planifier ou d’élargir la recherche.",
        `/app/missions/${m.id}`,
      );
      continue;
    }
    const pro = db.pros.find((p) => p.id === next);
    const user = pro ? db.users.find((u) => u.id === pro.userId) : null;
    const cat = db.categories.find((c) => c.id === m.categoryId);
    m.status = "offered";
    m.offerProId = next;
    m.offerExpiresAt = new Date(now + db.settings.offerSeconds * 1000).toISOString();
    if (user) {
      // Never notify if somehow unavailable (double-check)
      if (pro && canReceiveNowOffer(db, pro, new Date(now))) {
        notify(
          db,
          user.id,
          "Nouvelle mission disponible",
          `${cat?.name ?? "Mission"} · ${m.city} · ${m.price} €`,
          `/pro/missions/${m.id}`,
        );
      }
    }
  }
}

export function userById(db: DB, id: string) {
  return db.users.find((u) => u.id === id) ?? null;
}

export function proByUser(db: DB, userId: string) {
  return db.pros.find((p) => p.userId === userId) ?? null;
}

export function requireUser(db: DB, userId: string, role?: Role) {
  const user = userById(db, userId);
  if (!user || user.suspended) throw new Error("UNAUTHORIZED");
  if (role && user.role !== role) throw new Error("FORBIDDEN");
  return user;
}

const STATUS_FLOW: MissionStatus[] = [
  "accepted",
  "en_route",
  "arrived",
  "in_progress",
  "completed",
];

function labelFor(status: MissionStatus): string {
  const map: Record<string, string> = {
    accepted: "Mission confirmée",
    en_route: "Professionnel en route",
    arrived: "Professionnel arrivé",
    in_progress: "Intervention en cours",
    completed: "Intervention terminée",
  };
  return map[status] ?? status;
}

export function liveLocation(mission: Mission, pro: ProProfile | undefined) {
  if (!pro) return null;
  if (mission.status === "en_route" && mission.startProLat != null && mission.startProLng != null) {
    const startEvent = mission.timeline.find((t) => t.status === "en_route");
    const started = startEvent ? new Date(startEvent.at).getTime() : Date.now();
    const duration = Math.max(30, (mission.etaMinutes ?? 12) * 60) * 1000;
    const t = (Date.now() - started) / duration;
    const pos = interpolate(mission.startProLat, mission.startProLng, mission.lat, mission.lng, t);
    const remaining = Math.max(1, Math.ceil((1 - Math.min(1, t)) * (mission.etaMinutes ?? 12)));
    return { ...pos, etaMinutes: remaining, arrived: t >= 1 };
  }
  if (["arrived", "in_progress", "completed"].includes(mission.status)) {
    return { lat: mission.lat, lng: mission.lng, etaMinutes: 0, arrived: true };
  }
  return { lat: pro.lat, lng: pro.lng, etaMinutes: mission.etaMinutes, arrived: false };
}

export function enrichMission(db: DB, m: Mission) {
  const client = userById(db, m.clientId);
  const pro = m.proId ? db.pros.find((p) => p.id === m.proId) : m.offerProId ? db.pros.find((p) => p.id === m.offerProId) : undefined;
  const proUser = pro ? userById(db, pro.userId) : null;
  const category = db.categories.find((c) => c.id === m.categoryId);
  const messages = db.messages.filter((x) => x.missionId === m.id);
  const review = db.reviews.find((r) => r.missionId === m.id);
  const payment = db.payments.find((p) => p.missionId === m.id);
  const live = liveLocation(m, pro);
  const remainingOffer = m.offerExpiresAt
    ? Math.max(0, Math.ceil((new Date(m.offerExpiresAt).getTime() - Date.now()) / 1000))
    : 0;
  return {
    ...m,
    total: m.price + m.supplement,
    commission: Math.round((m.price + m.supplement) * m.commissionRate * 100) / 100,
    client: client ? publicUser(client) : null,
    category,
    pro: pro && proUser
      ? {
          ...pro,
          user: publicUser(proUser),
          distanceKm: haversineKm(m.lat, m.lng, pro.lat, pro.lng),
        }
      : null,
    live,
    remainingOffer,
    messages,
    review,
    payment,
  };
}

export { nid, notify, STATUS_FLOW, labelFor };

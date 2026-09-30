import fs from "fs/promises";
import path from "path";
import {
  availabilitySnapshot,
  busyProIds,
  canReceiveNowOffer,
  normalizePro,
} from "./availability";
import { etaMinutes, haversineKm, interpolate } from "./geo";
import {
  effectiveTier,
  isBoostActive,
  matchingScore,
  offerBonusSeconds,
  withTierSettings,
} from "./premium";
import { isClientPlusActive } from "./client-plus";
import { withRfqSettings } from "./rfq";
import { createSeed } from "./seed";
import { maskEmail, maskPhone, openPii, sealPii } from "./privacy";
import { enqueueProEmail, flushProEmailQueue, withMailSettings } from "./mail";
import { releaseDuePayouts } from "./escrow";
import { defaultCatalogProducts, ensureUserGrowthFields, withGrowthSettings } from "./growth";
import { backupDir, dbPath, ensureDataDirs } from "./paths";
import type {
  DB,
  Mission,
  MissionStatus,
  ProProfile,
  PublicUser,
  Role,
  User,
} from "./types";

const DB_PATH = dbPath();
const BACKUP_DIR = backupDir();
const MAX_BACKUPS = 12;
let writesSinceBackup = 0;

let chain: Promise<unknown> = Promise.resolve();

function migrate(db: DB): DB {
  db.pros = db.pros.map(normalizePro);
  db.settings = withGrowthSettings(withMailSettings(withRfqSettings(withTierSettings(db.settings))));
  if (!db.settings.offerSeconds) db.settings.offerSeconds = 20;
  if (db.settings.commissionRate == null) db.settings.commissionRate = 0.15;
  if (!db.quotes) db.quotes = [];
  if (!db.invoices) db.invoices = [];
  if (!db.requests) db.requests = [];
  if (!db.offers) db.offers = [];
  if (!db.outboundEmails) db.outboundEmails = [];
  if (!db.supportTickets) db.supportTickets = [];
  if (!db.walletLedgers) db.walletLedgers = [];
  if (!db.referrals) db.referrals = [];
  if (!db.promoCodes) db.promoCodes = [];
  if (!db.promoRedemptions) db.promoRedemptions = [];
  if (!db.slotPromos) db.slotPromos = [];
  if (!db.recurringPlans) db.recurringPlans = [];
  if (!db.products || db.products.length === 0) db.products = defaultCatalogProducts();
  if (!db.missionProducts) db.missionProducts = [];
  if (!db.guarantees) db.guarantees = [];
  db.disputes = (db.disputes ?? []).map((d) => ({
    ...d,
    category: d.category ?? "autre",
    status: d.status === "resolved" ? "resolved" : d.status === "closed" ? "closed" : d.status === "in_review" ? "in_review" : "open",
    messages: d.messages ?? [
      {
        id: `dmsg_${d.id}`,
        authorId: d.openedBy,
        role: "client" as const,
        text: d.reason,
        createdAt: d.createdAt,
      },
    ],
    resolution: d.resolution ?? null,
    resolvedAt: d.resolvedAt ?? (d.status === "resolved" ? d.createdAt : null),
    refundSuggested: d.refundSuggested ?? false,
    updatedAt: d.updatedAt ?? d.createdAt,
  }));
  db.pros = db.pros.map((p) => ({
    ...p,
    verificationNote: p.verificationNote ?? null,
    verificationSubmittedAt: p.verificationSubmittedAt ?? null,
    documents: (p.documents ?? []).map((doc) => ({
      ...doc,
      status: doc.status === "missing" ? "missing" : doc.status,
      url: doc.url ?? null,
      rejectReason: doc.rejectReason ?? null,
      submittedAt: doc.submittedAt ?? null,
      reviewedAt: doc.reviewedAt ?? null,
    })),
  }));
  db.missions = db.missions.map((m) => ({
    ...m,
    assigneeMemberId: m.assigneeMemberId ?? null,
    quoteId: m.quoteId ?? null,
    invoiceId: m.invoiceId ?? null,
    tip: m.tip ?? 0,
    pendingNegotiatePrice: m.pendingNegotiatePrice ?? null,
    pendingNegotiateNote: m.pendingNegotiateNote ?? null,
    isLargeWorks: m.isLargeWorks ?? false,
    liveLat: m.liveLat ?? null,
    liveLng: m.liveLng ?? null,
    liveUpdatedAt: m.liveUpdatedAt ?? null,
    payoutReleaseAt: m.payoutReleaseAt ?? null,
    promoCodeId: m.promoCodeId ?? null,
    promoDiscount: m.promoDiscount ?? 0,
    guaranteeId: m.guaranteeId ?? null,
    walletCreditUsed: m.walletCreditUsed ?? 0,
    recurringPlanId: m.recurringPlanId ?? null,
    slotPromoId: m.slotPromoId ?? null,
  }));
  db.payments = (db.payments ?? []).map((p) => ({
    ...p,
    releaseAt: p.releaseAt ?? null,
  }));
  for (const released of releaseDuePayouts(db)) {
    notify(
      db,
      released.proUserId,
      "Versement effectué",
      `${released.proAmount} € versés selon votre délai`,
      "/pro/revenus",
    );
  }
  db.invoices = (db.invoices ?? []).map((inv) => ({
    ...inv,
    tip: inv.tip ?? 0,
    status: inv.status ?? (inv.paidAt ? "paid" : "issued"),
    paidAt: inv.paidAt ?? null,
  }));
  db.users = db.users.map((u) => {
    if (u.role !== "client") {
      return ensureUserGrowthFields(
        {
          ...u,
          privacyConsentAt: u.privacyConsentAt ?? null,
          deletedAt: u.deletedAt ?? null,
          phone: openPii(u.phone),
        },
        db.settings,
      );
    }
    return ensureUserGrowthFields(
      {
        ...u,
        clientKind: u.clientKind ?? "particulier",
        organizationName: u.organizationName ?? null,
        organizationSiret: u.organizationSiret ?? null,
        clientPlusUntil: u.clientPlusUntil ?? null,
        clientPlusPlan: u.clientPlusPlan ?? "none",
        privacyConsentAt: u.privacyConsentAt ?? null,
        deletedAt: u.deletedAt ?? null,
        phone: openPii(u.phone),
      },
      db.settings,
    );
  });
  db.addresses = (db.addresses ?? []).map((a) => ({
    ...a,
    line: openPii(a.line),
  }));
  return db;
}

async function readFile(): Promise<DB> {
  try {
    await ensureDataDirs();
    const raw = await fs.readFile(DB_PATH, "utf8");
    return migrate(JSON.parse(raw) as DB);
  } catch {
    const seed = createSeed();
    await ensureDataDirs();
    // Persist sealed so PII never sits plaintext on disk
    const sealedUsers = seed.users.map((u) => ({ ...u, phone: sealPii(u.phone) }));
    const sealedAddrs = seed.addresses.map((a) => ({ ...a, line: sealPii(a.line) }));
    await fs.writeFile(
      DB_PATH,
      JSON.stringify({ ...seed, users: sealedUsers, addresses: sealedAddrs }, null, 2),
      "utf8",
    );
    return migrate(seed);
  }
}

async function writeFile(db: DB) {
  await ensureDataDirs();
  const dir = path.dirname(DB_PATH);
  const sealed: DB = {
    ...db,
    users: db.users.map((u) => ({
      ...u,
      phone: sealPii(u.phone),
    })),
    addresses: (db.addresses ?? []).map((a) => ({
      ...a,
      line: sealPii(a.line),
    })),
  };
  const payload = JSON.stringify(sealed, null, 2);
  const tmp = path.join(dir, `db.${process.pid}.${Date.now()}.tmp`);
  await fs.writeFile(tmp, payload, "utf8");
  await fs.rename(tmp, DB_PATH);
  writesSinceBackup += 1;
  if (writesSinceBackup >= 25) {
    writesSinceBackup = 0;
    void snapshotBackup(payload).catch(() => undefined);
  }
}

async function snapshotBackup(payload: string) {
  await fs.mkdir(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dest = path.join(BACKUP_DIR, `db-${stamp}.json`);
  await fs.writeFile(dest, payload, "utf8");
  const files = (await fs.readdir(BACKUP_DIR))
    .filter((f) => f.startsWith("db-") && f.endsWith(".json"))
    .sort();
  while (files.length > MAX_BACKUPS) {
    const oldest = files.shift();
    if (oldest) await fs.unlink(path.join(BACKUP_DIR, oldest)).catch(() => undefined);
  }
}

export async function exportDbSanitized(): Promise<object> {
  const db = await readFile();
  return {
    ...db,
    users: db.users.map(({ passwordHash: _p, ...u }) => u),
    exportedAt: new Date().toISOString(),
  };
}

export function resetDb() {
  return mutate(async () => {
    const seed = createSeed();
    await writeFile(seed);
    await snapshotBackup(JSON.stringify(seed, null, 2)).catch(() => undefined);
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
    broadcastRfqToFreePros(db);
    const result = await fn(db);
    if (persist) {
      await flushProEmailQueue(db);
      await writeFile(db);
    }
    return result;
  });
  chain = run.then(
    () => undefined,
    (err) => {
      console.error(JSON.stringify({ ts: new Date().toISOString(), level: "error", event: "db_mutate_failed", error: String(err) }));
      return undefined;
    },
  );
  return run;
}

function nid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function publicUser(user: User): PublicUser {
  const { passwordHash: _p, ...rest } = user;
  if (user.deletedAt) {
    return {
      ...rest,
      firstName: "Compte",
      lastName: "supprimé",
      email: "",
      phone: "",
      avatar: "?",
      organizationName: null,
      organizationSiret: null,
    };
  }
  return rest;
}

export function publicUserMasked(user: User): PublicUser {
  const base = publicUser(user);
  if (user.deletedAt) return base;
  return {
    ...base,
    email: maskEmail(base.email),
    phone: maskPhone(base.phone),
    lastName: base.lastName ? `${base.lastName.charAt(0)}.` : "",
  };
}

export function matchPros(db: DB, categoryId: string, lat: number, lng: number, opts?: { urgence?: boolean }) {
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
      score: matchingScore(p),
      tier: effectiveTier(p),
      boosted: isBoostActive(p),
    }))
    .filter(({ pro, distance }) => {
      const maxKm = opts?.urgence ? Math.min(pro.radiusKm, 15) : pro.radiusKm;
      return distance <= maxKm;
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
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
  opts?: { emailPro?: boolean },
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
  if (opts?.emailPro) {
    enqueueProEmail(db, userId, title, body, href);
  }
}

function broadcastRfqToFreePros(db: DB, now = Date.now()) {
  for (const req of db.requests ?? []) {
    if (req.status !== "open" || req.broadcastDone) continue;
    if (now < new Date(req.primeOnlyUntil).getTime()) continue;
    const cat = db.categories.find((c) => c.id === req.categoryId);
    for (const proId of req.candidateProIds) {
      const pro = db.pros.find((p) => p.id === proId);
      if (!pro) continue;
      const tier = effectiveTier(pro, new Date(now));
      if (tier === "prime" || tier === "elite") continue;
      notify(
        db,
        pro.userId,
        "Nouvelle demande client",
        `${cat?.name ?? "Service"} · ${req.city} · ${req.availabilityNote}`,
        `/pro/demandes/${req.id}`,
        { emailPro: true },
      );
    }
    req.broadcastDone = true;
  }
}

export function processDispatch(db: DB, now = Date.now()) {
  const settings = withTierSettings(db.settings);
  for (const m of db.missions) {
    if (m.type !== "now" && m.type !== "urgence") continue;
    if (m.status !== "searching" && m.status !== "offered") continue;
    if (m.offerProId) {
      if (!m.offerExpiresAt) continue;
      if (new Date(m.offerExpiresAt).getTime() > now) continue;
      m.declinedProIds.push(m.offerProId);
      m.candidateProIds = m.candidateProIds.filter((id) => id !== m.offerProId);
      m.offerProId = null;
      m.offerExpiresAt = null;
    }

    const age = now - new Date(m.createdAt).getTime();
    const eliteMs = settings.eliteExclusiveSeconds * 1000;
    const primeMs = settings.primeExclusiveSeconds * 1000;

    const eligible = m.candidateProIds
      .filter((id) => !m.declinedProIds.includes(id))
      .map((id) => db.pros.find((p) => p.id === id))
      .filter((pro): pro is ProProfile => !!pro && canReceiveNowOffer(db, pro, new Date(now)));

    const eliteLeft = eligible.filter((p) => effectiveTier(p, new Date(now)) === "elite");
    const primePlus = eligible.filter((p) => {
      const t = effectiveTier(p, new Date(now));
      return t === "elite" || t === "prime";
    });

    let pool = eligible;
    if (age < eliteMs && eliteLeft.length > 0) pool = eliteLeft;
    else if (age < primeMs && primePlus.length > 0) pool = primePlus;

    // Urgence: only currently available (already filtered) — prefer boosted + elite
    pool = [...pool].sort(
      (a, b) => matchingScore(b, new Date(now)) - matchingScore(a, new Date(now)),
    );

    const next = m.candidateProIds.find((id) => pool.some((p) => p.id === id)) ?? pool[0]?.id;

    if (!next) {
      if (eligible.length > 0) {
        m.status = "searching";
        continue;
      }
      m.status = "unmatched";
      notify(
        db,
        m.clientId,
        "Aucun professionnel disponible",
        m.type === "urgence"
          ? "Aucun pro dispo en urgence. Essayez AppO Now classique ou planifiez."
          : "Essayez de planifier ou d’élargir la recherche.",
        `/app/missions/${m.id}`,
      );
      continue;
    }
    const pro = db.pros.find((p) => p.id === next);
    const user = pro ? db.users.find((u) => u.id === pro.userId) : null;
    const cat = db.categories.find((c) => c.id === m.categoryId);
    const bonus = pro ? offerBonusSeconds(pro, settings) : 0;
    m.status = "offered";
    m.offerProId = next;
    m.offerExpiresAt = new Date(now + (settings.offerSeconds + bonus) * 1000).toISOString();
    if (user && pro && canReceiveNowOffer(db, pro, new Date(now))) {
      const tier = effectiveTier(pro, new Date(now));
      const tag =
        m.type === "urgence"
          ? " · Urgence ⚡"
          : tier === "elite"
            ? " · Priorité Elite"
            : tier === "prime"
              ? " · Priorité Prime"
              : "";
      notify(
        db,
        user.id,
        m.type === "urgence" ? "Urgence AppO" : "Nouvelle mission disponible",
        `${cat?.name ?? "Mission"} · ${m.city} · ${m.price} €${tag}`,
        `/pro/missions/${m.id}`,
        { emailPro: true },
      );
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
  if (!user || user.suspended || user.deletedAt) throw new Error("UNAUTHORIZED");
  if (role && user.role !== role) throw new Error("FORBIDDEN");
  return user;
}

/** Re-check role from DB (cookie role can be stale after privilege change) */
export function assertSessionRole(db: DB, userId: string, expected: Role) {
  const user = requireUser(db, userId);
  if (user.role !== expected) throw new Error("FORBIDDEN");
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

  if (["arrived", "in_progress", "completed"].includes(mission.status)) {
    return { lat: mission.lat, lng: mission.lng, etaMinutes: 0, arrived: true, source: "destination" as const };
  }

  if (mission.status === "en_route") {
    const hasGps =
      mission.liveLat != null &&
      mission.liveLng != null &&
      mission.liveUpdatedAt &&
      Date.now() - new Date(mission.liveUpdatedAt).getTime() < 5 * 60 * 1000;

    if (hasGps) {
      const dist = haversineKm(mission.liveLat!, mission.liveLng!, mission.lat, mission.lng);
      const remaining = Math.max(1, etaMinutes(dist));
      return {
        lat: mission.liveLat!,
        lng: mission.liveLng!,
        etaMinutes: remaining,
        arrived: dist < 0.08,
        source: "gps" as const,
      };
    }

    if (mission.startProLat != null && mission.startProLng != null) {
      const startEvent = mission.timeline.find((t) => t.status === "en_route");
      const started = startEvent ? new Date(startEvent.at).getTime() : Date.now();
      const duration = Math.max(30, (mission.etaMinutes ?? 12) * 60) * 1000;
      const t = (Date.now() - started) / duration;
      const pos = interpolate(mission.startProLat, mission.startProLng, mission.lat, mission.lng, t);
      const remaining = Math.max(1, Math.ceil((1 - Math.min(1, t)) * (mission.etaMinutes ?? 12)));
      return { ...pos, etaMinutes: remaining, arrived: t >= 1, source: "estimate" as const };
    }
  }

  return {
    lat: pro.lat,
    lng: pro.lng,
    etaMinutes: mission.etaMinutes,
    arrived: false,
    source: "pro_base" as const,
  };
}

export function contactsUnlocked(status: MissionStatus) {
  return ["accepted", "en_route", "arrived", "in_progress", "completed", "disputed"].includes(status);
}

function redactUser(user: PublicUser, unlocked: boolean, isSelf: boolean): PublicUser {
  if (unlocked || isSelf) return user;
  return {
    ...user,
    lastName: user.lastName ? `${user.lastName.charAt(0)}.` : "",
    phone: "",
    email: "",
  };
}

export function ensureInvoice(db: DB, m: Mission, now = new Date().toISOString()) {
  if (!m.proId) return null;
  if (!db.invoices) db.invoices = [];
  const tip = m.tip ?? 0;
  const amount = Math.max(0, m.price + m.supplement - (m.promoDiscount ?? 0));
  const commission = Math.round(amount * m.commissionRate * 100) / 100;
  const proAmount = Math.round((amount - commission + tip) * 100) / 100;
  if (m.invoiceId) {
    const existing = db.invoices.find((i) => i.id === m.invoiceId);
    if (existing) {
      existing.total = amount;
      existing.tip = tip;
      existing.commission = commission;
      existing.proAmount = proAmount;
      if (m.paymentStatus === "held" || m.paymentStatus === "scheduled" || m.paymentStatus === "paid") {
        existing.status = "paid";
        existing.paidAt = existing.paidAt ?? now;
      }
      return existing;
    }
  }
  const invoice = {
    id: nid("inv"),
    number: `FAC-${new Date().getFullYear()}-${String(db.invoices.length + 1).padStart(4, "0")}`,
    missionId: m.id,
    quoteId: m.quoteId,
    proId: m.proId,
    clientId: m.clientId,
    total: amount,
    tip,
    commission,
    proAmount,
    status: (m.paymentStatus === "held" || m.paymentStatus === "scheduled" || m.paymentStatus === "paid" ? "paid" : "issued") as "issued" | "paid",
    createdAt: now,
    paidAt: m.paymentStatus === "held" || m.paymentStatus === "scheduled" || m.paymentStatus === "paid" ? now : null,
  };
  db.invoices.push(invoice);
  m.invoiceId = invoice.id;
  return invoice;
}

export function enrichMission(db: DB, m: Mission, viewerId?: string) {
  const client = userById(db, m.clientId);
  const pro = m.proId
    ? db.pros.find((p) => p.id === m.proId)
    : m.offerProId
      ? db.pros.find((p) => p.id === m.offerProId)
      : undefined;
  const proUser = pro ? userById(db, pro.userId) : null;
  const category = db.categories.find((c) => c.id === m.categoryId);
  const unlocked = contactsUnlocked(m.status);
  const viewer = viewerId ? userById(db, viewerId) : null;
  const isClientViewer = viewer?.id === m.clientId;
  const isProViewer = !!(pro && viewer && viewer.id === pro.userId);
  const messages = unlocked
    ? db.messages.filter((x) => x.missionId === m.id)
    : [];
  const review = db.reviews.find((r) => r.missionId === m.id);
  const payment = db.payments.find((p) => p.missionId === m.id);
  const live = liveLocation(m, pro);
  const remainingOffer = m.offerExpiresAt
    ? Math.max(0, Math.ceil((new Date(m.offerExpiresAt).getTime() - Date.now()) / 1000))
    : 0;
  const contactedCount = (m.candidateProIds?.length ?? 0) + (m.declinedProIds?.length ?? 0);

  const clientPublic = client
    ? redactUser(publicUser(client), unlocked, isClientViewer)
    : null;
  const proUserPublic = proUser
    ? redactUser(publicUser(proUser), unlocked, isProViewer)
    : null;

  /** Hide exact address + coords from pro until accept — anti hors-appli */
  const addressVisible = unlocked || isClientViewer;
  const displayAddress = addressVisible ? m.address : "Adresse exacte après acceptation";
  /** City-level jitter until unlocked so exact pin isn't usable off-app */
  const displayLat = addressVisible ? m.lat : Math.round(m.lat * 100) / 100;
  const displayLng = addressVisible ? m.lng : Math.round(m.lng * 100) / 100;

  return {
    ...m,
    address: displayAddress,
    city: m.city,
    lat: displayLat,
    lng: displayLng,
    exactLocation: addressVisible,
    tip: m.tip ?? 0,
    pendingNegotiatePrice: m.pendingNegotiatePrice ?? null,
    pendingNegotiateNote: m.pendingNegotiateNote ?? null,
    isLargeWorks: m.isLargeWorks ?? false,
    promoDiscount: m.promoDiscount ?? 0,
    total: Math.max(0, m.price + m.supplement - (m.promoDiscount ?? 0)),
    tipTotal: Math.max(0, m.price + m.supplement - (m.promoDiscount ?? 0) + (m.tip ?? 0)),
    commission: Math.round(Math.max(0, m.price + m.supplement - (m.promoDiscount ?? 0)) * m.commissionRate * 100) / 100,
    contactsUnlocked: unlocked,
    products: (db.missionProducts ?? [])
      .filter((p) => p.missionId === m.id)
      .map((p) => ({
        ...p,
        catalog: (db.products ?? []).find((c) => c.id === p.productId) ?? null,
      })),
    guarantee: m.guaranteeId ? (db.guarantees ?? []).find((g) => g.id === m.guaranteeId) ?? null : null,
    client: clientPublic
      ? {
          ...clientPublic,
          clientPlusActive: isClientPlusActive(client),
        }
      : null,
    category,
    pro: pro && proUserPublic
      ? {
          ...pro,
          user: proUserPublic,
          distanceKm: haversineKm(m.lat, m.lng, pro.lat, pro.lng),
          company: unlocked || isProViewer ? pro.company : "Professionnel AppO",
        }
      : null,
    live,
    remainingOffer,
    contactedCount,
    messages,
    review,
    payment,
    quote: m.quoteId ? (db.quotes ?? []).find((q) => q.id === m.quoteId) ?? null : null,
    invoice: m.invoiceId ? (db.invoices ?? []).find((i) => i.id === m.invoiceId) ?? null : null,
    team: pro?.team ?? [],
  };
}

export { nid, notify, STATUS_FLOW, labelFor };

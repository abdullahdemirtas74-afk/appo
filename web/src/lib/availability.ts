import type { DB, ProAbsence, ProProfile, ScheduleDay } from "./types";

const ACTIVE_BUSY = ["offered", "accepted", "en_route", "arrived", "in_progress"];

export function parseHm(hm: string, base: Date) {
  const [h, m] = hm.split(":").map(Number);
  const d = new Date(base);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

export function inTimeRange(at: Date, start: string, end: string) {
  const s = parseHm(start, at).getTime();
  const e = parseHm(end, at).getTime();
  const t = at.getTime();
  return t >= s && t <= e;
}

export function getScheduleForDay(pro: ProProfile, at: Date): ScheduleDay | null {
  return pro.schedule.find((d) => d.day === at.getDay()) ?? null;
}

export function getActiveAbsence(pro: ProProfile, at = new Date()): ProAbsence | null {
  const t = at.getTime();
  const list = pro.absences ?? [];
  return (
    list.find((a) => {
      const start = new Date(a.startAt).getTime();
      const end = new Date(a.endAt).getTime();
      return t >= start && t <= end;
    }) ?? null
  );
}

export function nextAvailabilityAt(pro: ProProfile, from = new Date()): Date | null {
  const abs = getActiveAbsence(pro, from);
  if (abs) {
    return new Date(abs.endAt);
  }
  // if outside schedule, find next open slot within 7 days
  for (let i = 0; i < 7 * 24; i++) {
    const d = new Date(from.getTime() + i * 60 * 60 * 1000);
    if (!getActiveAbsence(pro, d) && isWithinWorkingHours(pro, d)) return d;
  }
  return null;
}

export function isWithinWorkingHours(pro: ProProfile, at = new Date()) {
  const day = getScheduleForDay(pro, at);
  if (!day || !day.available) return false;
  if (!inTimeRange(at, day.start, day.end)) return false;
  if (day.breakStart && day.breakEnd && inTimeRange(at, day.breakStart, day.breakEnd)) {
    return false;
  }
  return true;
}

export function busyProIds(db: DB, at = new Date()) {
  const busy = new Set<string>();
  for (const m of db.missions) {
    if (!ACTIVE_BUSY.includes(m.status)) continue;
    if (m.proId) busy.add(m.proId);
    if (m.offerProId) busy.add(m.offerProId);
  }
  // also count accepted scheduled missions that overlap "now" capacity for same day
  const dayKey = at.toDateString();
  const counts = new Map<string, number>();
  for (const m of db.missions) {
    if (!m.proId) continue;
    if (!["accepted", "en_route", "arrived", "in_progress", "offered"].includes(m.status)) continue;
    const when = m.scheduledAt ? new Date(m.scheduledAt) : new Date(m.createdAt);
    if (when.toDateString() !== dayKey) continue;
    counts.set(m.proId, (counts.get(m.proId) ?? 0) + 1);
  }
  for (const [proId, n] of counts) {
    const pro = db.pros.find((p) => p.id === proId);
    const max = pro?.maxMissionsPerDay ?? 1;
    if (n >= max) busy.add(proId);
  }
  return busy;
}

export type AvailabilityReason =
  | "ok"
  | "unverified"
  | "suspended"
  | "offline"
  | "absence"
  | "outside_hours"
  | "busy"
  | "lead_time";

export type AvailabilitySnapshot = {
  availableNow: boolean;
  bookable: boolean;
  reason: AvailabilityReason;
  label: string;
  absence: ProAbsence | null;
  backAt: string | null;
  online: boolean;
  withinHours: boolean;
};

export function availabilitySnapshot(
  db: DB,
  pro: ProProfile,
  at = new Date(),
  opts?: { forScheduledAt?: Date },
): AvailabilitySnapshot {
  const absence = getActiveAbsence(pro, opts?.forScheduledAt ?? at);
  const withinHours = isWithinWorkingHours(pro, opts?.forScheduledAt ?? at);
  const busy = busyProIds(db, at).has(pro.id);
  const back = nextAvailabilityAt(pro, at);

  if (pro.status === "suspended") {
    return {
      availableNow: false,
      bookable: false,
      reason: "suspended",
      label: "Compte suspendu",
      absence,
      backAt: null,
      online: false,
      withinHours,
    };
  }
  if (pro.status !== "verified" || !pro.verified) {
    return {
      availableNow: false,
      bookable: false,
      reason: "unverified",
      label: "Compte non vérifié",
      absence,
      backAt: null,
      online: pro.online,
      withinHours,
    };
  }
  if (absence) {
    const end = new Date(absence.endAt);
    const reasonWord =
      absence.reason === "conges"
        ? "En congés"
        : absence.reason === "maladie"
          ? "En arrêt"
          : absence.reason === "formation"
            ? "En formation"
            : absence.reason === "pause"
              ? "En pause"
              : "Indisponible";
    const label =
      absence.reason === "pause"
        ? `${reasonWord} jusqu’à ${end.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
        : `${reasonWord} jusqu’au ${end.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`;
    return {
      availableNow: false,
      bookable: false,
      reason: "absence",
      label,
      absence,
      backAt: absence.endAt,
      online: false,
      withinHours,
    };
  }

  if (opts?.forScheduledAt) {
    const leadH = pro.leadTimeHours ?? 2;
    const minAt = new Date(at.getTime() + leadH * 3600 * 1000);
    if (opts.forScheduledAt.getTime() < minAt.getTime()) {
      return {
        availableNow: false,
        bookable: false,
        reason: "lead_time",
        label: `Réservation possible à partir de ${leadH}h à l’avance`,
        absence: null,
        backAt: minAt.toISOString(),
        online: pro.online,
        withinHours,
      };
    }
    if (!withinHours) {
      return {
        availableNow: false,
        bookable: false,
        reason: "outside_hours",
        label: "Hors créneaux du professionnel",
        absence: null,
        backAt: back?.toISOString() ?? null,
        online: pro.online,
        withinHours,
      };
    }
    // buffer check vs other missions that day
    if (hasBufferConflict(db, pro, opts.forScheduledAt)) {
      return {
        availableNow: false,
        bookable: false,
        reason: "busy",
        label: "Créneau trop proche d’une autre mission",
        absence: null,
        backAt: null,
        online: pro.online,
        withinHours,
      };
    }
    return {
      availableNow: pro.online && withinHours && !busy,
      bookable: true,
      reason: "ok",
      label: "Créneau disponible",
      absence: null,
      backAt: null,
      online: pro.online,
      withinHours,
    };
  }

  if (!pro.online) {
    return {
      availableNow: false,
      bookable: true,
      reason: "offline",
      label: "Hors ligne",
      absence: null,
      backAt: back?.toISOString() ?? null,
      online: false,
      withinHours,
    };
  }
  if (!withinHours) {
    return {
      availableNow: false,
      bookable: true,
      reason: "outside_hours",
      label: "Hors horaires aujourd’hui",
      absence: null,
      backAt: back?.toISOString() ?? null,
      online: true,
      withinHours: false,
    };
  }
  if (busy) {
    return {
      availableNow: false,
      bookable: true,
      reason: "busy",
      label: "En mission",
      absence: null,
      backAt: null,
      online: true,
      withinHours: true,
    };
  }
  return {
    availableNow: true,
    bookable: true,
    reason: "ok",
    label: "Disponible maintenant",
    absence: null,
    backAt: null,
    online: true,
    withinHours: true,
  };
}

function hasBufferConflict(db: DB, pro: ProProfile, scheduledAt: Date) {
  const buffer = (pro.bufferMinutes ?? 30) * 60 * 1000;
  const t = scheduledAt.getTime();
  return db.missions.some((m) => {
    if (m.proId !== pro.id) return false;
    if (["cancelled", "completed", "unmatched", "disputed"].includes(m.status)) return false;
    const when = m.scheduledAt ? new Date(m.scheduledAt).getTime() : new Date(m.createdAt).getTime();
    return Math.abs(when - t) < buffer;
  });
}

export function canReceiveNowOffer(db: DB, pro: ProProfile, at = new Date()) {
  const snap = availabilitySnapshot(db, pro, at);
  return snap.availableNow;
}

export function conflictingMissionsDuringAbsence(db: DB, proId: string, startAt: string, endAt: string) {
  const s = new Date(startAt).getTime();
  const e = new Date(endAt).getTime();
  return db.missions.filter((m) => {
    if (m.proId !== proId) return false;
    if (["cancelled", "completed", "unmatched"].includes(m.status)) return false;
    if (!["accepted", "offered", "en_route", "arrived", "in_progress"].includes(m.status)) return false;
    const when = m.scheduledAt ? new Date(m.scheduledAt).getTime() : new Date(m.createdAt).getTime();
    return when >= s && when <= e;
  });
}

export function normalizePro(pro: ProProfile): ProProfile {
  return {
    ...pro,
    absences: pro.absences ?? [],
    bufferMinutes: pro.bufferMinutes ?? 30,
    leadTimeHours: pro.leadTimeHours ?? 2,
    maxMissionsPerDay: pro.maxMissionsPerDay ?? 1,
    premiumUntil: pro.premiumUntil ?? null,
    premiumPlan: pro.premiumPlan ?? "none",
    schedule: (pro.schedule ?? []).map((d) => ({
      ...d,
      breakStart: d.breakStart ?? (d.available ? "12:00" : null),
      breakEnd: d.breakEnd ?? (d.available ? "13:00" : null),
    })),
  };
}

import { hashPassword, verifyPassword } from "./auth";
import {
  enrichMission,
  matchPros,
  mutate,
  nid,
  notify,
  processDispatch,
  proByUser,
  publicUser,
  requireUser,
  resetDb,
  STATUS_FLOW,
  labelFor,
  availabilitySnapshot,
} from "./db";
import {
  canReceiveNowOffer,
  conflictingMissionsDuringAbsence,
  getActiveAbsence,
} from "./availability";
import { etaMinutes, haversineKm } from "./geo";
import {
  extendPremiumUntil,
  isPremiumActive,
  premiumDaysLeft,
  withPremiumSettings,
} from "./premium";
import type { AbsenceReason, Mission, MissionStatus, ProAbsence, Role, ScheduleDay } from "./types";

export async function login(email: string, password: string) {
  return mutate((db) => {
    const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user || !verifyPassword(password, user.passwordHash)) {
      throw new Error("INVALID_CREDENTIALS");
    }
    if (user.suspended) throw new Error("SUSPENDED");
    return publicUser(user);
  }, false);
}

export async function registerClient(input: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  address?: { line: string; city: string; zip: string; lat: number; lng: number };
}) {
  return mutate((db) => {
    if (db.users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
      throw new Error("EMAIL_TAKEN");
    }
    const user = {
      id: nid("usr"),
      role: "client" as const,
      email: input.email.toLowerCase(),
      passwordHash: hashPassword(input.password),
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      avatar: `${input.firstName[0] ?? "A"}${input.lastName[0] ?? ""}`.toUpperCase(),
      createdAt: new Date().toISOString(),
      suspended: false,
    };
    db.users.push(user);
    if (input.address) {
      db.addresses.push({
        id: nid("adr"),
        userId: user.id,
        label: "Domicile",
        ...input.address,
        isDefault: true,
      });
    }
    return publicUser(user);
  });
}

export async function registerPro(input: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  company: string;
  siret: string;
  categoryIds: string[];
  radiusKm: number;
  startingPrice: number;
  description: string;
  city: string;
  lat: number;
  lng: number;
}) {
  return mutate((db) => {
    if (db.users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
      throw new Error("EMAIL_TAKEN");
    }
    const user = {
      id: nid("usr"),
      role: "pro" as const,
      email: input.email.toLowerCase(),
      passwordHash: hashPassword(input.password),
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      avatar: `${input.firstName[0] ?? "P"}${input.lastName[0] ?? ""}`.toUpperCase(),
      createdAt: new Date().toISOString(),
      suspended: false,
    };
    db.users.push(user);
    db.pros.push({
      id: nid("pro"),
      userId: user.id,
      company: input.company,
      siret: input.siret,
      description: input.description,
      experienceYears: 0,
      radiusKm: input.radiusKm,
      lat: input.lat,
      lng: input.lng,
      city: input.city,
      online: false,
      verified: false,
      status: "pending",
      startingPrice: input.startingPrice,
      categoryIds: input.categoryIds,
      photos: [],
      certifications: [],
      documents: [
        { id: nid("doc"), type: "identite", name: "piece_identite.pdf", status: "pending" },
        { id: nid("doc"), type: "entreprise", name: "kbis.pdf", status: "pending" },
        { id: nid("doc"), type: "assurance", name: "rc_pro.pdf", status: "pending" },
      ],
      schedule: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
        day,
        start: "08:00",
        end: "19:00",
        available: day !== 0,
        breakStart: day !== 0 ? "12:00" : null,
        breakEnd: day !== 0 ? "13:00" : null,
      })),
      absences: [],
      bufferMinutes: 30,
      leadTimeHours: 2,
      maxMissionsPerDay: 1,
      premiumUntil: null,
      premiumPlan: "none",
      rating: 0,
      reviewCount: 0,
      missionCount: 0,
      acceptanceRate: 1,
    });
    const admin = db.users.find((u) => u.role === "admin");
    if (admin) {
      notify(db, admin.id, "Nouveau professionnel à valider", `${input.company} — ${input.firstName} ${input.lastName}`, "/admin/pros");
    }
    return publicUser(user);
  });
}

export async function getMe(userId: string) {
  return mutate((db) => {
    const user = requireUser(db, userId);
    const addresses = db.addresses.filter((a) => a.userId === user.id);
    const notifications = db.notifications.filter((n) => n.userId === user.id).slice(0, 30);
    const favorites = db.favorites.filter((f) => f.clientId === user.id);
    const pro = proByUser(db, user.id);
    return {
      user: publicUser(user),
      addresses,
      notifications,
      favorites,
      unread: notifications.filter((n) => !n.read).length,
      settings: db.settings,
      pro: pro
        ? {
            ...pro,
            availability: availabilitySnapshot(db, pro),
            premiumActive: isPremiumActive(pro),
            premiumDaysLeft: premiumDaysLeft(pro),
          }
        : null,
    };
  }, true);
}

export async function listCategories() {
  return mutate((db) => db.categories.filter((c) => c.active), false);
}

export async function listPros(params: {
  userId?: string;
  categoryId?: string;
  q?: string;
  lat?: number;
  lng?: number;
  available?: boolean;
  minRating?: number;
  maxPrice?: number;
  maxKm?: number;
}) {
  return mutate((db) => {
    const origin = {
      lat: params.lat ?? db.addresses.find((a) => a.userId === params.userId && a.isDefault)?.lat ?? 45.8782,
      lng: params.lng ?? db.addresses.find((a) => a.userId === params.userId && a.isDefault)?.lng ?? 6.0581,
    };
    let list = db.pros.filter((p) => p.status === "verified");
    if (params.categoryId) list = list.filter((p) => p.categoryIds.includes(params.categoryId!));
    if (params.minRating) list = list.filter((p) => p.rating >= params.minRating!);
    if (params.maxPrice) list = list.filter((p) => p.startingPrice <= params.maxPrice!);
    if (params.q) {
      const q = params.q.toLowerCase();
      list = list.filter((p) => {
        const u = db.users.find((x) => x.id === p.userId);
        return (
          p.company.toLowerCase().includes(q) ||
          u?.firstName.toLowerCase().includes(q) ||
          u?.lastName.toLowerCase().includes(q)
        );
      });
    }
    return list
      .map((p) => {
        const user = db.users.find((u) => u.id === p.userId)!;
        const distanceKm = haversineKm(origin.lat, origin.lng, p.lat, p.lng);
        const availability = availabilitySnapshot(db, p);
        const premiumActive = isPremiumActive(p);
        return {
          ...p,
          user: publicUser(user),
          distanceKm,
          availableNow: availability.availableNow && distanceKm <= p.radiusKm,
          availability,
          premiumActive,
        };
      })
      .filter((p) => (params.available ? p.availableNow : true))
      .filter((p) => (params.maxKm ? p.distanceKm <= params.maxKm : true))
      .sort(
        (a, b) =>
          Number(b.premiumActive) - Number(a.premiumActive) ||
          Number(b.availableNow) - Number(a.availableNow) ||
          a.distanceKm - b.distanceKm,
      );
  }, false);
}

export async function getPro(id: string, origin?: { lat: number; lng: number }) {
  return mutate((db) => {
    const p = db.pros.find((x) => x.id === id);
    if (!p) throw new Error("NOT_FOUND");
    const user = db.users.find((u) => u.id === p.userId)!;
    const reviews = db.reviews.filter((r) => r.proId === p.id).map((r) => ({
      ...r,
      client: publicUser(db.users.find((u) => u.id === r.clientId)!),
    }));
    const categories = db.categories.filter((c) => p.categoryIds.includes(c.id));
    const distanceKm = origin ? haversineKm(origin.lat, origin.lng, p.lat, p.lng) : null;
    const availability = availabilitySnapshot(db, p);
    const premiumActive = isPremiumActive(p);
    return {
      ...p,
      user: publicUser(user),
      reviews,
      categories,
      distanceKm,
      availability,
      availableNow: availability.availableNow,
      premiumActive,
    };
  }, false);
}

export async function createMission(userId: string, input: {
  type: "now" | "scheduled";
  categoryId: string;
  description: string;
  photos: string[];
  address: string;
  city: string;
  lat: number;
  lng: number;
  scheduledAt?: string;
  proId?: string;
}) {
  return mutate((db) => {
    const user = requireUser(db, userId, "client");
    const category = db.categories.find((c) => c.id === input.categoryId);
    if (!category || !category.active) throw new Error("INVALID_CATEGORY");
    const mission: Mission = {
      id: nid("mis"),
      type: input.type,
      clientId: user.id,
      proId: input.proId ?? null,
      categoryId: input.categoryId,
      status: "searching",
      address: input.address,
      city: input.city,
      lat: input.lat,
      lng: input.lng,
      description: input.description,
      photos: input.photos ?? [],
      scheduledAt: input.scheduledAt ?? null,
      price: category.indicativePrice,
      supplement: 0,
      pendingSupplement: null,
      pendingSupplementReason: null,
      commissionRate: db.settings.commissionRate,
      createdAt: new Date().toISOString(),
      timeline: [],
      candidateProIds: [],
      declinedProIds: [],
      offerProId: null,
      offerExpiresAt: null,
      etaMinutes: null,
      startProLat: null,
      startProLng: null,
      paymentStatus: "none",
      paymentMethod: null,
    };

    if (input.proId) {
      const pro = db.pros.find((p) => p.id === input.proId);
      if (!pro || pro.status !== "verified") throw new Error("PRO_UNAVAILABLE");
      if (input.type === "now") {
        if (!canReceiveNowOffer(db, pro)) throw new Error("PRO_UNAVAILABLE");
      } else if (input.scheduledAt) {
        const snap = availabilitySnapshot(db, pro, new Date(), {
          forScheduledAt: new Date(input.scheduledAt),
        });
        if (!snap.bookable) throw new Error("PRO_UNAVAILABLE");
      }
      mission.price = pro.startingPrice;
      mission.status = "offered";
      mission.offerProId = pro.id;
      mission.candidateProIds = [pro.id];
      const proUser = db.users.find((u) => u.id === pro.userId);
      if (proUser) {
        notify(
          db,
          proUser.id,
          input.type === "now" ? "Nouvelle mission AppO Now" : "Nouvelle réservation planifiée",
          `${category.name} · ${input.city}`,
          `/pro/missions/${mission.id}`,
        );
      }
    } else {
      const matched = matchPros(db, input.categoryId, input.lat, input.lng);
      mission.candidateProIds = matched.map((m) => m.pro.id);
      if (matched[0]) mission.price = matched[0].pro.startingPrice;
    }

    db.missions.unshift(mission);
    processDispatch(db);
    const fresh = db.missions.find((m) => m.id === mission.id)!;
    return enrichMission(db, fresh);
  });
}

export async function listMissions(userId: string) {
  return mutate((db) => {
    const user = requireUser(db, userId);
    processDispatch(db);
    const pro = proByUser(db, user.id);
    const list = db.missions.filter((m) => {
      if (user.role === "admin") return true;
      if (user.role === "client") return m.clientId === user.id;
      if (!pro) return false;
      return m.proId === pro.id || m.offerProId === pro.id;
    });
    return list.map((m) => enrichMission(db, m));
  }, true);
}

export async function getMission(userId: string, id: string) {
  return mutate((db) => {
    const user = requireUser(db, userId);
    processDispatch(db);
    const m = db.missions.find((x) => x.id === id);
    if (!m) throw new Error("NOT_FOUND");
    const pro = proByUser(db, user.id);
    const allowed =
      user.role === "admin" ||
      m.clientId === user.id ||
      (pro && (m.proId === pro.id || m.offerProId === pro.id));
    if (!allowed) throw new Error("FORBIDDEN");
    return enrichMission(db, m);
  }, true);
}

export async function missionAction(userId: string, id: string, action: string, payload: Record<string, unknown> = {}) {
  return mutate((db) => {
    const user = requireUser(db, userId);
    const m = db.missions.find((x) => x.id === id);
    if (!m) throw new Error("NOT_FOUND");
    const pro = proByUser(db, user.id);
    const now = new Date().toISOString();

    if (action === "accept") {
      if (!pro || m.offerProId !== pro.id) throw new Error("FORBIDDEN");
      if (m.status !== "offered") throw new Error("INVALID_STATE");
      m.proId = pro.id;
      m.offerProId = null;
      m.offerExpiresAt = null;
      m.status = "accepted";
      m.etaMinutes = etaMinutes(haversineKm(m.lat, m.lng, pro.lat, pro.lng));
      m.startProLat = pro.lat;
      m.startProLng = pro.lng;
      m.timeline.push({ status: "accepted", at: now, label: labelFor("accepted") });
      notify(db, m.clientId, "Mission confirmée ✅", `${user.firstName} a accepté votre mission.`, `/app/missions/${m.id}`);
    } else if (action === "pass") {
      if (!pro || m.offerProId !== pro.id) throw new Error("FORBIDDEN");
      m.declinedProIds.push(pro.id);
      m.candidateProIds = m.candidateProIds.filter((x) => x !== pro.id);
      m.offerProId = null;
      m.offerExpiresAt = null;
      m.status = "searching";
      processDispatch(db);
    } else if (action === "status") {
      if (!pro || m.proId !== pro.id) throw new Error("FORBIDDEN");
      const next = String(payload.status) as MissionStatus;
      const idx = STATUS_FLOW.indexOf(m.status);
      const nextIdx = STATUS_FLOW.indexOf(next);
      if (nextIdx !== idx + 1) throw new Error("INVALID_STATE");
      m.status = next;
      m.timeline.push({ status: next, at: now, label: labelFor(next) });
      if (next === "en_route") {
        m.startProLat = pro.lat;
        m.startProLng = pro.lng;
        notify(db, m.clientId, `Votre professionnel arrive dans ${m.etaMinutes ?? 12} minutes`, `${user.firstName} est en route.`, `/app/missions/${m.id}`);
      } else if (next === "arrived") {
        notify(db, m.clientId, "Votre professionnel est arrivé", `${user.firstName} est sur place.`, `/app/missions/${m.id}`);
      } else if (next === "completed") {
        m.paymentStatus = "pending";
        pro.missionCount += 1;
        notify(db, m.clientId, "Intervention terminée", `Paiement sécurisé — ${m.price + m.supplement} €`, `/app/missions/${m.id}`);
      }
    } else if (action === "message") {
      const text = String(payload.text ?? "").trim();
      const photo = payload.photo ? String(payload.photo) : undefined;
      if (!text && !photo) throw new Error("EMPTY");
      if (user.role === "client" && m.clientId !== user.id) throw new Error("FORBIDDEN");
      if (user.role === "pro" && (!pro || m.proId !== pro.id)) throw new Error("FORBIDDEN");
      db.messages.push({
        id: nid("msg"),
        missionId: m.id,
        senderId: user.id,
        text,
        photo,
        createdAt: now,
      });
      const other = user.role === "client" ? (pro ? db.users.find((u) => u.id === pro.userId)?.id : undefined) : m.clientId;
      if (other) notify(db, other, "Nouveau message", text || "Photo", user.role === "client" ? `/pro/missions/${m.id}` : `/app/missions/${m.id}`);
    } else if (action === "supplement") {
      if (!pro || m.proId !== pro.id) throw new Error("FORBIDDEN");
      if (!["arrived", "in_progress"].includes(m.status)) throw new Error("INVALID_STATE");
      m.pendingSupplement = Number(payload.amount);
      m.pendingSupplementReason = String(payload.reason ?? "Problème supplémentaire constaté");
      notify(db, m.clientId, `Supplément demandé : +${m.pendingSupplement} €`, m.pendingSupplementReason ?? "", `/app/missions/${m.id}`);
    } else if (action === "respondSupplement") {
      if (m.clientId !== user.id) throw new Error("FORBIDDEN");
      if (m.pendingSupplement == null) throw new Error("INVALID_STATE");
      const accept = Boolean(payload.accept);
      if (accept) {
        m.supplement += m.pendingSupplement;
      }
      m.pendingSupplement = null;
      m.pendingSupplementReason = null;
      if (pro) {
        const proUser = db.users.find((u) => u.id === pro.userId);
        if (proUser) {
          notify(db, proUser.id, accept ? "Supplément accepté" : "Supplément refusé", "", `/pro/missions/${m.id}`);
        }
      }
    } else if (action === "pay") {
      if (m.clientId !== user.id) throw new Error("FORBIDDEN");
      if (m.status !== "completed" || m.paymentStatus === "paid") throw new Error("INVALID_STATE");
      const amount = m.price + m.supplement;
      const commission = Math.round(amount * m.commissionRate * 100) / 100;
      db.payments.push({
        id: nid("pay"),
        missionId: m.id,
        amount,
        commission,
        proAmount: Math.round((amount - commission) * 100) / 100,
        status: "paid",
        method: String(payload.method ?? "card"),
        createdAt: now,
        paidAt: now,
      });
      m.paymentStatus = "paid";
      m.paymentMethod = String(payload.method ?? "card");
      if (pro) {
        const proUser = db.users.find((u) => u.id === pro.userId);
        if (proUser) notify(db, proUser.id, "Paiement reçu", `${amount} € encaissés via AppO`, `/pro/revenus`);
      }
    } else if (action === "review") {
      if (m.clientId !== user.id) throw new Error("FORBIDDEN");
      if (m.status !== "completed" || m.paymentStatus !== "paid") throw new Error("INVALID_STATE");
      if (db.reviews.some((r) => r.missionId === m.id)) throw new Error("ALREADY_REVIEWED");
      const rating = Number(payload.rating);
      if (rating < 1 || rating > 5) throw new Error("INVALID_RATING");
      db.reviews.push({
        id: nid("rev"),
        missionId: m.id,
        clientId: user.id,
        proId: m.proId!,
        rating,
        comment: String(payload.comment ?? ""),
        photos: Array.isArray(payload.photos) ? (payload.photos as string[]) : [],
        createdAt: now,
      });
      if (pro) {
        const total = pro.rating * pro.reviewCount + rating;
        pro.reviewCount += 1;
        pro.rating = Math.round((total / pro.reviewCount) * 10) / 10;
        const proUser = db.users.find((u) => u.id === pro.userId);
        if (proUser) notify(db, proUser.id, "Nouvel avis", `${rating}/5 — ${String(payload.comment ?? "")}`, `/pro/profil`);
      }
    } else if (action === "cancel") {
      if (m.clientId !== user.id && user.role !== "admin") throw new Error("FORBIDDEN");
      if (["completed", "cancelled"].includes(m.status)) throw new Error("INVALID_STATE");
      m.status = "cancelled";
      m.timeline.push({ status: "cancelled", at: now, label: "Mission annulée" });
    } else if (action === "dispute") {
      if (m.clientId !== user.id && !(pro && m.proId === pro.id)) throw new Error("FORBIDDEN");
      m.status = "disputed";
      db.disputes.push({
        id: nid("dsp"),
        missionId: m.id,
        openedBy: user.id,
        reason: String(payload.reason ?? "Litige"),
        status: "open",
        createdAt: now,
      });
      const admin = db.users.find((u) => u.role === "admin");
      if (admin) notify(db, admin.id, "Nouveau litige", String(payload.reason ?? ""), "/admin/litiges");
    } else {
      throw new Error("UNKNOWN_ACTION");
    }

    return enrichMission(db, m);
  });
}

export async function toggleFavorite(userId: string, proId: string) {
  return mutate((db) => {
    requireUser(db, userId, "client");
    const i = db.favorites.findIndex((f) => f.clientId === userId && f.proId === proId);
    if (i >= 0) db.favorites.splice(i, 1);
    else db.favorites.push({ clientId: userId, proId });
    return db.favorites.filter((f) => f.clientId === userId);
  });
}

export async function updatePro(userId: string, patch: Record<string, unknown>) {
  return mutate((db) => {
    requireUser(db, userId, "pro");
    const pro = proByUser(db, userId);
    if (!pro) throw new Error("NOT_FOUND");

    if (patch.action === "addAbsence") {
      const startAt = String(patch.startAt);
      const endAt = String(patch.endAt);
      if (!startAt || !endAt || new Date(endAt) <= new Date(startAt)) throw new Error("INVALID_ABSENCE");
      const absence: ProAbsence = {
        id: nid("abs"),
        startAt,
        endAt,
        reason: (String(patch.reason || "conges") as AbsenceReason),
        note: patch.note ? String(patch.note) : undefined,
      };
      pro.absences = [...(pro.absences ?? []), absence].sort((a, b) => a.startAt.localeCompare(b.startAt));
      const conflicts = conflictingMissionsDuringAbsence(db, pro.id, startAt, endAt);
      // If absence covers now, force offline for Now reception clarity
      if (getActiveAbsence(pro)) {
        pro.online = false;
      }
      return { pro, conflicts: conflicts.map((m) => enrichMission(db, m)), availability: availabilitySnapshot(db, pro) };
    }

    if (patch.action === "removeAbsence") {
      const id = String(patch.absenceId);
      pro.absences = (pro.absences ?? []).filter((a) => a.id !== id);
      return { pro, availability: availabilitySnapshot(db, pro) };
    }

    if (patch.action === "subscribePremium") {
      if (pro.status !== "verified") throw new Error("NOT_VERIFIED");
      const plan = patch.plan === "yearly" ? "yearly" : "monthly";
      const settings = withPremiumSettings(db.settings);
      const amount = plan === "yearly" ? settings.premiumYearlyPrice : settings.premiumMonthlyPrice;
      pro.premiumUntil = extendPremiumUntil(pro.premiumUntil, plan);
      pro.premiumPlan = plan;
      // Simulated marketplace payment (no card charge)
      db.payments.unshift({
        id: nid("pay"),
        missionId: `premium_${pro.id}`,
        amount,
        commission: amount,
        proAmount: 0,
        method: "card",
        status: "paid",
        createdAt: new Date().toISOString(),
        paidAt: new Date().toISOString(),
      });
      notify(
        db,
        pro.userId,
        "AppO Premium activé",
        plan === "yearly"
          ? "Vous êtes Premium 12 mois : annonces prioritaires + mise en avant."
          : "Vous êtes Premium 30 jours : annonces prioritaires + mise en avant.",
        "/pro/premium",
      );
      return {
        pro,
        premiumActive: true,
        premiumDaysLeft: premiumDaysLeft(pro),
        amount,
        plan,
      };
    }

    if (typeof patch.online === "boolean") {
      // Cannot go online while currently on absence
      if (patch.online && getActiveAbsence(pro)) throw new Error("ON_ABSENCE");
      pro.online = patch.online && pro.verified;
    }
    if (typeof patch.radiusKm === "number") pro.radiusKm = patch.radiusKm;
    if (typeof patch.description === "string") pro.description = patch.description;
    if (typeof patch.startingPrice === "number") pro.startingPrice = patch.startingPrice;
    if (Array.isArray(patch.schedule)) pro.schedule = patch.schedule as ScheduleDay[];
    if (typeof patch.bufferMinutes === "number") pro.bufferMinutes = Math.max(0, patch.bufferMinutes);
    if (typeof patch.leadTimeHours === "number") pro.leadTimeHours = Math.max(0, patch.leadTimeHours);
    if (typeof patch.maxMissionsPerDay === "number") {
      pro.maxMissionsPerDay = Math.max(1, Math.min(10, patch.maxMissionsPerDay));
    }
    if (typeof patch.lat === "number") pro.lat = patch.lat;
    if (typeof patch.lng === "number") pro.lng = patch.lng;
    return { pro, availability: availabilitySnapshot(db, pro) };
  });
}

export async function proStats(userId: string) {
  return mutate((db) => {
    requireUser(db, userId, "pro");
    const pro = proByUser(db, userId);
    if (!pro) throw new Error("NOT_FOUND");
    const pays = db.payments.filter((p) => {
      const m = db.missions.find((x) => x.id === p.missionId);
      return m?.proId === pro.id && p.status === "paid";
    });
    const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const today = startOf(new Date());
    const week = today - 6 * 86400000;
    const month = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
    const sum = (from: number) =>
      pays.filter((p) => new Date(p.paidAt ?? p.createdAt).getTime() >= from).reduce((a, p) => a + p.proAmount, 0);
    const gross = (from: number) =>
      pays.filter((p) => new Date(p.paidAt ?? p.createdAt).getTime() >= from).reduce((a, p) => a + p.amount, 0);
    const fees = (from: number) =>
      pays.filter((p) => new Date(p.paidAt ?? p.createdAt).getTime() >= from).reduce((a, p) => a + p.commission, 0);
    return {
      today: sum(today),
      week: sum(week),
      month: sum(month),
      grossMonth: gross(month),
      feesMonth: fees(month),
      upcoming: db.missions
        .filter((m) => m.proId === pro.id && m.status === "completed" && m.paymentStatus === "pending")
        .reduce((a, m) => a + (m.price + m.supplement) * (1 - m.commissionRate), 0),
      payments: pays.sort((a, b) => (b.paidAt ?? "").localeCompare(a.paidAt ?? "")),
      missions: db.missions.filter((m) => m.proId === pro.id).length,
      rating: pro.rating,
      online: pro.online,
      availability: availabilitySnapshot(db, pro),
      absences: pro.absences ?? [],
      bufferMinutes: pro.bufferMinutes,
      leadTimeHours: pro.leadTimeHours,
      maxMissionsPerDay: pro.maxMissionsPerDay,
      schedule: pro.schedule,
      premiumActive: isPremiumActive(pro),
      premiumUntil: pro.premiumUntil,
      premiumPlan: pro.premiumPlan,
      premiumDaysLeft: premiumDaysLeft(pro),
      premium: withPremiumSettings(db.settings),
      offer: (() => {
        if (!canReceiveNowOffer(db, pro)) return null;
        const raw = db.missions.find((m) => m.offerProId === pro.id && m.status === "offered") ?? null;
        return raw ? enrichMission(db, raw) : null;
      })(),
    };
  }, true);
}

export async function adminOverview() {
  return mutate((db) => {
    const paid = db.payments.filter((p) => p.status === "paid");
    const volume = paid.reduce((a, p) => a + p.amount, 0);
    const revenue = paid.reduce((a, p) => a + p.commission, 0);
    const cancelled = db.missions.filter((m) => m.status === "cancelled").length;
    return {
      userCount: db.users.length,
      clientCount: db.users.filter((u) => u.role === "client").length,
      proCount: db.pros.length,
      activePros: db.pros.filter((p) => p.online && p.verified).length,
      pendingPros: db.pros.filter((p) => p.status === "pending").length,
      missionCount: db.missions.length,
      liveMissions: db.missions.filter((m) => ["offered", "accepted", "en_route", "arrived", "in_progress"].includes(m.status)).length,
      volume,
      revenue,
      averageBasket: paid.length ? volume / paid.length : 0,
      cancelRate: db.missions.length ? cancelled / db.missions.length : 0,
      conversion: db.missions.length ? db.missions.filter((m) => m.status === "completed").length / db.missions.length : 0,
      settings: db.settings,
      categories: db.categories,
      disputes: db.disputes,
      payments: paid.slice(0, 50),
    };
  }, false);
}

export async function adminAction(userId: string, action: string, payload: Record<string, unknown>) {
  return mutate((db) => {
    requireUser(db, userId, "admin");
    if (action === "verifyPro") {
      const pro = db.pros.find((p) => p.id === payload.proId);
      if (!pro) throw new Error("NOT_FOUND");
      const decision = String(payload.decision);
      if (decision === "verified") {
        pro.status = "verified";
        pro.verified = true;
        pro.documents = pro.documents.map((d) => ({ ...d, status: "approved" }));
        notify(db, pro.userId, "Compte Pro vérifié", "Votre badge Pro vérifié est activé. Vous pouvez recevoir des missions.", "/pro");
      } else if (decision === "rejected") {
        pro.status = "rejected";
        pro.verified = false;
        notify(db, pro.userId, "Inscription refusée", String(payload.reason ?? "Dossier incomplet"), "/pro");
      } else if (decision === "suspended") {
        pro.status = "suspended";
        pro.online = false;
        pro.verified = false;
      }
      return pro;
    }
    if (action === "suspendUser") {
      const user = db.users.find((u) => u.id === payload.userId);
      if (!user) throw new Error("NOT_FOUND");
      user.suspended = Boolean(payload.suspended);
      return publicUser(user);
    }
    if (action === "category") {
      const id = String(payload.id ?? nid("cat"));
      let cat = db.categories.find((c) => c.id === id);
      if (!cat) {
        cat = {
          id,
          name: String(payload.name),
          slug: String(payload.slug ?? payload.name).toLowerCase().replace(/\s+/g, "-"),
          emoji: String(payload.emoji ?? "➕"),
          indicativePrice: Number(payload.indicativePrice ?? 50),
          active: true,
        };
        db.categories.push(cat);
      } else {
        if (payload.name) cat.name = String(payload.name);
        if (payload.emoji) cat.emoji = String(payload.emoji);
        if (payload.indicativePrice != null) cat.indicativePrice = Number(payload.indicativePrice);
        if (payload.active != null) cat.active = Boolean(payload.active);
      }
      return cat;
    }
    if (action === "settings") {
      if (payload.commissionRate != null) db.settings.commissionRate = Number(payload.commissionRate);
      if (payload.offerSeconds != null) db.settings.offerSeconds = Number(payload.offerSeconds);
      if (payload.premiumMonthlyPrice != null) db.settings.premiumMonthlyPrice = Number(payload.premiumMonthlyPrice);
      if (payload.premiumYearlyPrice != null) db.settings.premiumYearlyPrice = Number(payload.premiumYearlyPrice);
      if (payload.premiumExclusiveSeconds != null) {
        db.settings.premiumExclusiveSeconds = Number(payload.premiumExclusiveSeconds);
      }
      if (payload.premiumOfferBonusSeconds != null) {
        db.settings.premiumOfferBonusSeconds = Number(payload.premiumOfferBonusSeconds);
      }
      db.settings = withPremiumSettings(db.settings);
      return db.settings;
    }
    if (action === "resolveDispute") {
      const d = db.disputes.find((x) => x.id === payload.id);
      if (!d) throw new Error("NOT_FOUND");
      d.status = "resolved";
      const m = db.missions.find((x) => x.id === d.missionId);
      if (m && m.status === "disputed") m.status = "completed";
      return d;
    }
    if (action === "refund") {
      const p = db.payments.find((x) => x.id === payload.paymentId);
      if (!p) throw new Error("NOT_FOUND");
      p.status = "refunded";
      const m = db.missions.find((x) => x.id === p.missionId);
      if (m) m.paymentStatus = "refunded";
      return p;
    }
    if (action === "reset") {
      return { ok: true, reset: true };
    }
    throw new Error("UNKNOWN_ACTION");
  }).then(async (res) => {
    if (action === "reset") return resetDb();
    return res;
  });
}

export async function adminLists() {
  return mutate((db) => ({
    users: db.users.map(publicUser),
    pros: db.pros.map((p) => ({
      ...p,
      user: publicUser(db.users.find((u) => u.id === p.userId)!),
      premiumActive: isPremiumActive(p),
    })),
    missions: db.missions.map((m) => enrichMission(db, m)),
    payments: db.payments,
    disputes: db.disputes.map((d) => ({
      ...d,
      mission: db.missions.find((m) => m.id === d.missionId),
    })),
    categories: db.categories,
    settings: withPremiumSettings(db.settings),
  }), false);
}

export function errorStatus(e: unknown) {
  const msg = e instanceof Error ? e.message : "ERROR";
  const map: Record<string, number> = {
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INVALID_CREDENTIALS: 401,
    EMAIL_TAKEN: 409,
    SUSPENDED: 403,
    NOT_VERIFIED: 403,
  };
  return { status: map[msg] ?? 400, error: msg };
}

export { publicUser };
export type { Role };

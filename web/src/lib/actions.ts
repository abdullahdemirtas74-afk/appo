import { hashPassword, verifyPassword } from "./auth";
import {
  enrichMission,
  ensureInvoice,
  contactsUnlocked,
  matchPros,
  mutate,
  nid,
  notify,
  processDispatch,
  proByUser,
  publicUser,
  publicUserMasked,
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
import {
  clientPlusDaysLeft,
  extendClientPlusUntil,
  isClientPlusActive,
  withClientPlusSettings,
} from "./client-plus";
import { etaMinutes, haversineKm } from "./geo";
import {
  commissionForPro,
  computeLoyaltyBadge,
  docsReadyForReview,
  effectiveTier,
  extendBoostUntil,
  extendPrimeUntil,
  isBoostActive,
  isPrimeActive,
  matchingScore,
  primeDaysLeft,
  verificationChecklist,
  verifiedComplete,
  withTierSettings,
} from "./premium";
import type {
  AbsenceReason,
  Mission,
  MissionStatus,
  ProAbsence,
  QuoteLine,
  Role,
  ScheduleDay,
} from "./types";
import { mailQuotaSnapshot, promotePendingProEmails, withMailSettings } from "./mail";
import { normalizePhotoUrls } from "./uploads";

export async function login(email: string, password: string) {
  return mutate((db) => {
    const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user || !verifyPassword(password, user.passwordHash)) {
      throw new Error("INVALID_CREDENTIALS");
    }
    if (user.suspended) throw new Error("SUSPENDED");
    if (user.deletedAt) throw new Error("ACCOUNT_DELETED");
    return publicUser(user);
  }, false);
}

export async function registerClient(input: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  clientKind?: "particulier" | "entreprise" | "syndicat";
  organizationName?: string;
  organizationSiret?: string;
  privacyConsent?: boolean;
  address?: { line: string; city: string; zip: string; lat: number; lng: number };
}) {
  return mutate((db) => {
    if (db.users.some((u) => u.email.toLowerCase() === input.email.toLowerCase() && !u.deletedAt)) {
      throw new Error("EMAIL_TAKEN");
    }
    if (!input.privacyConsent) throw new Error("PRIVACY_CONSENT_REQUIRED");
    const kind = input.clientKind ?? "particulier";
    if ((kind === "entreprise" || kind === "syndicat") && !String(input.organizationName || "").trim()) {
      throw new Error("ORG_REQUIRED");
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
      clientKind: kind,
      organizationName: kind === "particulier" ? null : String(input.organizationName || "").trim(),
      organizationSiret: kind === "particulier" ? null : String(input.organizationSiret || "").trim() || null,
      clientPlusUntil: null as string | null,
      clientPlusPlan: "none" as const,
      privacyConsentAt: new Date().toISOString(),
      deletedAt: null as string | null,
    };
    db.users.push(user);
    if (input.address) {
      db.addresses.push({
        id: nid("adr"),
        userId: user.id,
        label: kind === "syndicat" ? "Copropriété" : kind === "entreprise" ? "Siège" : "Domicile",
        ...input.address,
        isDefault: true,
      });
    }
    return publicUser(user);
  });
}

export async function updateClientProfile(
  userId: string,
  patch: {
    clientKind?: "particulier" | "entreprise" | "syndicat";
    organizationName?: string;
    organizationSiret?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  },
) {
  return mutate((db) => {
    const user = requireUser(db, userId, "client");
    if (patch.clientKind) {
      user.clientKind = patch.clientKind;
      if (patch.clientKind === "particulier") {
        user.organizationName = null;
        user.organizationSiret = null;
      }
    }
    if (patch.organizationName !== undefined) {
      user.organizationName = String(patch.organizationName).trim() || null;
    }
    if (patch.organizationSiret !== undefined) {
      user.organizationSiret = String(patch.organizationSiret).trim() || null;
    }
    if (patch.firstName) user.firstName = patch.firstName;
    if (patch.lastName) user.lastName = patch.lastName;
    if (patch.phone) user.phone = patch.phone;
    const kind = user.clientKind ?? "particulier";
    if ((kind === "entreprise" || kind === "syndicat") && !user.organizationName) {
      throw new Error("ORG_REQUIRED");
    }
    return publicUser(user);
  });
}

export async function subscribeClientPlus(userId: string, plan: "monthly" | "yearly" = "monthly") {
  return mutate((db) => {
    const user = requireUser(db, userId, "client");
    const settings = withClientPlusSettings(withTierSettings(db.settings));
    const amount = plan === "yearly" ? settings.clientPlusYearlyPrice : settings.clientPlusMonthlyPrice;
    user.clientPlusUntil = extendClientPlusUntil(user.clientPlusUntil, plan);
    user.clientPlusPlan = plan;
    db.payments.unshift({
      id: nid("pay"),
      missionId: `clientplus_${user.id}`,
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
      user.id,
      "AppO+ activé",
      plan === "yearly"
        ? "12 mois : commissions réduites, négociation de prix, alertes prioritaires pour les pros."
        : "30 jours : commissions réduites, négociation de prix, alertes prioritaires pour les pros.",
      "/app/plus",
    );
    return {
      user: publicUser(user),
      clientPlusActive: true,
      clientPlusDaysLeft: clientPlusDaysLeft(user),
      amount,
      plan,
    };
  });
}

export async function markNotificationsRead(userId: string, ids?: string[]) {
  return mutate((db) => {
    requireUser(db, userId);
    for (const n of db.notifications) {
      if (n.userId !== userId) continue;
      if (!ids || ids.includes(n.id)) n.read = true;
    }
    return {
      unread: db.notifications.filter((n) => n.userId === userId && !n.read).length,
    };
  });
}

export async function setDefaultAddress(userId: string, addressId: string) {
  return mutate((db) => {
    requireUser(db, userId, "client");
    const mine = db.addresses.filter((a) => a.userId === userId);
    if (!mine.some((a) => a.id === addressId)) throw new Error("NOT_FOUND");
    for (const a of mine) a.isDefault = a.id === addressId;
    return mine;
  });
}

export async function addClientAddress(
  userId: string,
  input: { label: string; line: string; city: string; zip: string; lat?: number; lng?: number },
) {
  return mutate((db) => {
    requireUser(db, userId, "client");
    const mine = db.addresses.filter((a) => a.userId === userId);
    for (const a of mine) a.isDefault = false;
    const addr = {
      id: nid("adr"),
      userId,
      label: String(input.label || "Adresse").trim(),
      line: String(input.line).trim(),
      city: String(input.city).trim(),
      zip: String(input.zip || "").trim(),
      lat: Number(input.lat ?? 45.8782),
      lng: Number(input.lng ?? 6.0581),
      isDefault: true,
    };
    db.addresses.push(addr);
    return db.addresses.filter((a) => a.userId === userId);
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
  privacyConsent?: boolean;
}) {
  return mutate((db) => {
    if (!input.privacyConsent) throw new Error("PRIVACY_CONSENT_REQUIRED");
    if (db.users.some((u) => u.email.toLowerCase() === input.email.toLowerCase() && !u.deletedAt)) {
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
      privacyConsentAt: new Date().toISOString(),
      deletedAt: null as string | null,
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
      subscriptionTier: "pro",
      primeUntil: null,
      primePlan: "none",
      boostUntil: null,
      loyaltyPoints: 0,
      loyaltyBadge: "none",
      businessEnabled: false,
      team: [
        {
          id: nid("tm"),
          name: `${input.firstName} ${input.lastName}`.trim(),
          phone: input.phone,
          role: "owner",
          active: true,
        },
      ],
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
      settings: withClientPlusSettings(withTierSettings(db.settings)),
      clientPlusActive: user.role === "client" ? isClientPlusActive(user) : false,
      clientPlusDaysLeft: user.role === "client" ? clientPlusDaysLeft(user) : 0,
      pro: pro
        ? {
            ...pro,
            availability: availabilitySnapshot(db, pro),
            premiumActive: isPrimeActive(pro),
            premiumDaysLeft: primeDaysLeft(pro),
            tier: effectiveTier(pro),
            boostActive: isBoostActive(pro),
            loyaltyBadge: computeLoyaltyBadge(pro),
            verifiedComplete: verifiedComplete(pro),
            checklist: verificationChecklist(pro),
            docsReadyForReview: docsReadyForReview(pro),
            primeDaysLeft: primeDaysLeft(pro),
          }
        : null,
    };
  }, true);
}

/** RGPD art. 15 — export des données personnelles du compte */
export async function exportPersonalData(userId: string) {
  return mutate((db) => {
    const user = requireUser(db, userId);
    const addresses = db.addresses.filter((a) => a.userId === user.id);
    const missions = db.missions
      .filter((m) => m.clientId === user.id || (user.role === "pro" && db.pros.some((p) => p.userId === user.id && p.id === m.proId)))
      .map((m) => ({
        id: m.id,
        type: m.type,
        status: m.status,
        categoryId: m.categoryId,
        address: m.address,
        city: m.city,
        description: m.description,
        price: m.price,
        createdAt: m.createdAt,
        paymentStatus: m.paymentStatus,
      }));
    const favorites = db.favorites.filter((f) => f.clientId === user.id);
    const notifications = db.notifications.filter((n) => n.userId === user.id);
    const requests = (db.requests ?? []).filter((r) => r.clientId === user.id);
    return {
      exportedAt: new Date().toISOString(),
      subject: "AppO — export données personnelles (RGPD)",
      user: publicUser(user),
      addresses,
      missions,
      favorites,
      notifications,
      requests: requests.map((r) => ({
        id: r.id,
        status: r.status,
        categoryId: r.categoryId,
        description: r.description,
        createdAt: r.createdAt,
      })),
    };
  }, false);
}

/** RGPD art. 17 — anonymisation / suppression du compte */
export async function deleteMyAccount(userId: string, confirm: string) {
  if (confirm !== "SUPPRIMER") throw new Error("CONFIRM_REQUIRED");
  return mutate((db) => {
    const user = requireUser(db, userId);
    if (user.role === "admin") throw new Error("FORBIDDEN");
    const now = new Date().toISOString();
    const openStatuses = new Set([
      "searching",
      "offered",
      "accepted",
      "en_route",
      "arrived",
      "in_progress",
      "disputed",
    ]);
    for (const m of db.missions) {
      if (m.clientId !== user.id) continue;
      if (openStatuses.has(m.status)) {
        m.status = "cancelled";
        m.timeline.push({ status: "cancelled", at: now, label: "Annulée (compte supprimé)" });
      }
      m.address = "[adresse supprimée]";
      m.description = m.description ? "[description anonymisée]" : "";
      m.photos = [];
    }
    for (const r of db.requests ?? []) {
      if (r.clientId === user.id && (r.status === "open" || r.status === "awarded")) {
        r.status = "cancelled";
      }
    }
    for (const msg of db.messages) {
      if (msg.senderId === user.id) {
        msg.text = "[message supprimé]";
        msg.photo = undefined;
      }
    }
    db.addresses = db.addresses.filter((a) => a.userId !== user.id);
    db.favorites = db.favorites.filter((f) => f.clientId !== user.id);
    db.notifications = db.notifications.filter((n) => n.userId !== user.id);

    user.deletedAt = now;
    user.email = `deleted_${user.id}@anon.appo.local`;
    user.passwordHash = hashPassword(`revoked_${user.id}_${Date.now()}`);
    user.firstName = "Compte";
    user.lastName = "supprimé";
    user.phone = "";
    user.avatar = "?";
    user.organizationName = null;
    user.organizationSiret = null;
    user.clientPlusUntil = null;
    user.clientPlusPlan = "none";
    user.suspended = true;

    const pro = proByUser(db, user.id);
    if (pro) {
      pro.online = false;
      pro.verified = false;
      pro.status = "suspended";
      pro.siret = "********";
      pro.description = "";
      pro.team = (pro.team ?? []).map((t) => ({ ...t, phone: "", active: false }));
    }

    return { ok: true, deletedAt: now };
  });
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
  favoritesOnly?: boolean;
}) {
  return mutate((db) => {
    const origin = {
      lat: params.lat ?? db.addresses.find((a) => a.userId === params.userId && a.isDefault)?.lat ?? 45.8782,
      lng: params.lng ?? db.addresses.find((a) => a.userId === params.userId && a.isDefault)?.lng ?? 6.0581,
    };
    let list = db.pros.filter((p) => p.status === "verified");
    if (params.favoritesOnly && params.userId) {
      const favIds = new Set(db.favorites.filter((f) => f.clientId === params.userId).map((f) => f.proId));
      list = list.filter((p) => favIds.has(p.id));
    }
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
        const premiumActive = isPrimeActive(p);
        const boostActive = isBoostActive(p);
        return {
          ...p,
          user: publicUser(user),
          distanceKm,
          availableNow: availability.availableNow && distanceKm <= p.radiusKm,
          availability,
          premiumActive,
          boostActive,
          tier: effectiveTier(p),
          verifiedComplete: verifiedComplete(p),
          score: matchingScore(p),
        };
      })
      .filter((p) => (params.available ? p.availableNow : true))
      .filter((p) => (params.maxKm ? p.distanceKm <= params.maxKm : true))
      .sort(
        (a, b) =>
          b.score - a.score ||
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
    const premiumActive = isPrimeActive(p);
    return {
      ...p,
      user: publicUser(user),
      reviews,
      categories,
      distanceKm,
      availability,
      availableNow: availability.availableNow,
      premiumActive,
      boostActive: isBoostActive(p),
      tier: effectiveTier(p),
      verifiedComplete: verifiedComplete(p),
      loyaltyBadge: computeLoyaltyBadge(p),
      primeDaysLeft: primeDaysLeft(p),
    };
  }, false);
}

export async function createMission(userId: string, input: {
  type: "now" | "scheduled" | "urgence";
  categoryId: string;
  description: string;
  photos: string[];
  address: string;
  city: string;
  lat: number;
  lng: number;
  scheduledAt?: string;
  proId?: string;
  isLargeWorks?: boolean;
}) {
  return mutate((db) => {
    const user = requireUser(db, userId, "client");
    const category = db.categories.find((c) => c.id === input.categoryId);
    if (!category || !category.active) throw new Error("INVALID_CATEGORY");
    if (!String(input.address || "").trim() || !String(input.city || "").trim()) {
      throw new Error("ADDRESS_REQUIRED");
    }
    const photos = normalizePhotoUrls(input.photos);
    if ((input.photos?.length ?? 0) > 0 && photos.length === 0) throw new Error("PHOTO_TOO_LARGE");
    const settings = withClientPlusSettings(withTierSettings(db.settings));
    const isUrgence = input.type === "urgence";
    const clientPlus = isClientPlusActive(user);
    let price = category.indicativePrice;
    if (isUrgence) price = Math.round(price * settings.urgencePriceMultiplier * 100) / 100;
    const mission: Mission = {
      id: nid("mis"),
      type: input.type,
      clientId: user.id,
      proId: input.proId ?? null,
      categoryId: input.categoryId,
      status: "searching",
      address: String(input.address).trim(),
      city: String(input.city).trim(),
      lat: input.lat,
      lng: input.lng,
      description: input.description,
      photos,
      scheduledAt: input.scheduledAt ?? null,
      price,
      supplement: 0,
      pendingSupplement: null,
      pendingSupplementReason: null,
      pendingNegotiatePrice: null,
      pendingNegotiateNote: null,
      tip: 0,
      commissionRate: isUrgence
        ? Math.min(0.35, settings.commissionRate + settings.urgenceCommissionBonus)
        : clientPlus
          ? settings.commissionClientPlus
          : settings.commissionRate,
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
      assigneeMemberId: null,
      quoteId: null,
      invoiceId: null,
      isLargeWorks: Boolean(input.isLargeWorks),
    };

    const alertPrefix = clientPlus ? "⭐ Client AppO+ · " : "";

    if (input.proId) {
      const pro = db.pros.find((p) => p.id === input.proId);
      if (!pro || pro.status !== "verified") throw new Error("PRO_UNAVAILABLE");
      if (input.type === "now" || input.type === "urgence") {
        if (!canReceiveNowOffer(db, pro)) throw new Error("PRO_UNAVAILABLE");
      } else if (input.scheduledAt) {
        const snap = availabilitySnapshot(db, pro, new Date(), {
          forScheduledAt: new Date(input.scheduledAt),
        });
        if (!snap.bookable) throw new Error("PRO_UNAVAILABLE");
      }
      mission.price = isUrgence
        ? Math.round(pro.startingPrice * settings.urgencePriceMultiplier * 100) / 100
        : pro.startingPrice;
      mission.commissionRate = commissionForPro(pro, settings, isUrgence, user);
      mission.status = "offered";
      mission.offerProId = pro.id;
      mission.candidateProIds = [pro.id];
      const proUser = db.users.find((u) => u.id === pro.userId);
      if (proUser) {
        notify(
          db,
          proUser.id,
          alertPrefix +
            (input.type === "urgence"
              ? "Urgence AppO"
              : input.type === "now"
                ? "Nouvelle mission AppO Now"
                : mission.isLargeWorks
                  ? "Devis gros travaux"
                  : "Nouvelle réservation planifiée"),
          `${category.name} · ${input.city}${clientPlus ? " · alerte prioritaire" : ""}`,
          `/pro/missions/${mission.id}`,
        );
      }
    } else {
      const matched = matchPros(db, input.categoryId, input.lat, input.lng, {
        urgence: isUrgence,
      });
      mission.candidateProIds = matched.map((m) => m.pro.id);
      if (matched[0]) {
        const base = matched[0].pro.startingPrice;
        mission.price = isUrgence
          ? Math.round(base * settings.urgencePriceMultiplier * 100) / 100
          : base;
      }
      if (clientPlus) {
        for (const row of matched.slice(0, 5)) {
          const proUser = db.users.find((u) => u.id === row.pro.userId);
          if (proUser) {
            notify(
              db,
              proUser.id,
              "⭐ Alerte prioritaire AppO+",
              `${category.name} · ${input.city} — client AppO+ près de vous`,
              `/pro/missions/${mission.id}`,
            );
          }
        }
      }
    }

    db.missions.unshift(mission);
    processDispatch(db);
    const fresh = db.missions.find((m) => m.id === mission.id)!;
    return enrichMission(db, fresh, userId);
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
    return list.map((m) => enrichMission(db, m, userId));
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
    return enrichMission(db, m, userId);
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
      const client = db.users.find((u) => u.id === m.clientId);
      m.commissionRate = commissionForPro(pro, db.settings, m.type === "urgence", client);
      m.etaMinutes = etaMinutes(haversineKm(m.lat, m.lng, pro.lat, pro.lng));
      m.startProLat = pro.lat;
      m.startProLng = pro.lng;
      m.liveLat = null;
      m.liveLng = null;
      m.liveUpdatedAt = null;
      m.timeline.push({ status: "accepted", at: now, label: labelFor("accepted") });
      notify(db, m.clientId, "Mission confirmée ✅", `${user.firstName} a accepté votre mission. Coordonnées débloquées.`, `/app/missions/${m.id}`);
      notify(db, m.clientId, "Confidentialité", "Téléphone et adresse exacte sont maintenant visibles des deux côtés.", `/app/missions/${m.id}`);
    } else if (action === "updatePosition") {
      if (!pro || m.proId !== pro.id) throw new Error("FORBIDDEN");
      if (!["accepted", "en_route"].includes(m.status)) throw new Error("INVALID_STATE");
      const lat = Number(payload.lat);
      const lng = Number(payload.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error("INVALID_LOCATION");
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) throw new Error("INVALID_LOCATION");
      // Throttle: ignore updates denser than 4s
      if (m.liveUpdatedAt && Date.now() - new Date(m.liveUpdatedAt).getTime() < 4000) {
        return enrichMission(db, m, userId);
      }
      m.liveLat = lat;
      m.liveLng = lng;
      m.liveUpdatedAt = now;
      pro.lat = lat;
      pro.lng = lng;
      if (m.status === "en_route") {
        m.etaMinutes = etaMinutes(haversineKm(m.lat, m.lng, lat, lng));
      }
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
        m.startProLat = m.liveLat ?? pro.lat;
        m.startProLng = m.liveLng ?? pro.lng;
        if (m.liveLat == null) {
          m.liveLat = pro.lat;
          m.liveLng = pro.lng;
          m.liveUpdatedAt = now;
        }
        m.etaMinutes = etaMinutes(haversineKm(m.lat, m.lng, m.startProLat, m.startProLng));
        notify(db, m.clientId, `Votre professionnel arrive dans ${m.etaMinutes ?? 12} minutes`, `${user.firstName} est en route.`, `/app/missions/${m.id}`);
      } else if (next === "arrived") {
        notify(db, m.clientId, "Votre professionnel est arrivé", `${user.firstName} est sur place.`, `/app/missions/${m.id}`);
      } else if (next === "completed") {
        m.paymentStatus = "pending";
        pro.missionCount += 1;
        ensureInvoice(db, m, now);
        const inv = m.invoiceId ? db.invoices.find((i) => i.id === m.invoiceId) : null;
        notify(
          db,
          m.clientId,
          "Intervention terminée · Facture disponible",
          inv
            ? `Facture ${inv.number} · ${m.price + m.supplement} € — payez et laissez un pourboire si vous le souhaitez.`
            : `Paiement sécurisé — ${m.price + m.supplement} €`,
          `/app/missions/${m.id}`,
        );
        notify(
          db,
          pro.userId,
          "Intervention terminée · Facture émise",
          inv ? `Facture ${inv.number} envoyée au client` : "En attente du paiement client",
          `/pro/missions/${m.id}`,
        );
      }
    } else if (action === "message") {
      const text = String(payload.text ?? "").trim();
      const photo = payload.photo ? String(payload.photo) : undefined;
      if (!text && !photo) throw new Error("EMPTY");
      if (!contactsUnlocked(m.status)) throw new Error("CONTACTS_LOCKED");
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
    } else if (action === "negotiate") {
      if (m.clientId !== user.id) throw new Error("FORBIDDEN");
      if (!isClientPlusActive(user)) throw new Error("PLUS_REQUIRED");
      if (!contactsUnlocked(m.status) || m.paymentStatus === "paid") throw new Error("INVALID_STATE");
      if (m.pendingNegotiatePrice != null) throw new Error("INVALID_STATE");
      const proposed = Number(payload.price);
      if (!Number.isFinite(proposed) || proposed <= 0 || proposed >= m.price + m.supplement) {
        throw new Error("INVALID_PRICE");
      }
      m.pendingNegotiatePrice = Math.round(proposed * 100) / 100;
      m.pendingNegotiateNote = String(payload.note ?? "Proposition AppO+");
      if (pro) {
        notify(
          db,
          pro.userId,
          `Négociation AppO+ : ${m.pendingNegotiatePrice} €`,
          m.pendingNegotiateNote ?? "Le client propose un autre prix",
          `/pro/missions/${m.id}`,
        );
      }
    } else if (action === "respondNegotiate") {
      if (!pro || m.proId !== pro.id) throw new Error("FORBIDDEN");
      if (m.pendingNegotiatePrice == null) throw new Error("INVALID_STATE");
      const accept = Boolean(payload.accept);
      if (accept) {
        m.price = m.pendingNegotiatePrice;
        m.supplement = 0;
        ensureInvoice(db, m, now);
      }
      const proposed = m.pendingNegotiatePrice;
      m.pendingNegotiatePrice = null;
      m.pendingNegotiateNote = null;
      notify(
        db,
        m.clientId,
        accept ? "Prix accepté par le pro" : "Proposition refusée",
        accept ? `Nouveau prix : ${proposed} €` : "Le professionnel a refusé la négociation",
        `/app/missions/${m.id}`,
      );
    } else if (action === "pay") {
      if (m.clientId !== user.id) throw new Error("FORBIDDEN");
      if (m.status !== "completed" || m.paymentStatus === "paid") throw new Error("INVALID_STATE");
      const tip = Math.max(0, Math.round(Number(payload.tip ?? m.tip ?? 0) * 100) / 100);
      m.tip = tip;
      const amount = m.price + m.supplement;
      const commission = Math.round(amount * m.commissionRate * 100) / 100;
      const proAmount = Math.round((amount - commission + tip) * 100) / 100;
      db.payments.push({
        id: nid("pay"),
        missionId: m.id,
        amount: amount + tip,
        commission,
        proAmount,
        status: "paid",
        method: String(payload.method ?? "card"),
        createdAt: now,
        paidAt: now,
      });
      m.paymentStatus = "paid";
      m.paymentMethod = String(payload.method ?? "card");
      const missionPro = m.proId ? db.pros.find((p) => p.id === m.proId) : null;
      if (missionPro) {
        const invoice = ensureInvoice(db, m, now);
        if (invoice) {
          invoice.status = "paid";
          invoice.paidAt = now;
          invoice.tip = tip;
          invoice.proAmount = proAmount;
        }
        const ratingBonus = Math.max(0, Math.round(missionPro.rating));
        missionPro.loyaltyPoints = (missionPro.loyaltyPoints ?? 0) + 10 + ratingBonus + (tip > 0 ? 5 : 0);
        missionPro.loyaltyBadge = computeLoyaltyBadge(missionPro);
        const proUser = db.users.find((u) => u.id === missionPro.userId);
        if (proUser) {
          notify(
            db,
            proUser.id,
            tip > 0 ? `Paiement + pourboire ${tip} €` : "Paiement reçu",
            `${amount + tip} € encaissés via AppO`,
            `/pro/revenus`,
          );
        }
      }
    } else if (action === "tip") {
      if (m.clientId !== user.id) throw new Error("FORBIDDEN");
      if (m.status !== "completed") throw new Error("INVALID_STATE");
      const tip = Math.max(0, Math.round(Number(payload.amount ?? 0) * 100) / 100);
      if (tip <= 0) throw new Error("INVALID_PRICE");
      if (m.paymentStatus === "paid") {
        const prev = m.tip ?? 0;
        m.tip = tip;
        const delta = tip - prev;
        if (delta <= 0) throw new Error("INVALID_PRICE");
        const pay = db.payments.find((p) => p.missionId === m.id);
        if (pay) {
          pay.amount += delta;
          pay.proAmount += delta;
        }
        ensureInvoice(db, m, now);
        if (m.proId) {
          const missionPro = db.pros.find((p) => p.id === m.proId);
          if (missionPro) {
            notify(db, missionPro.userId, `Pourboire ${tip} €`, "Merci du client 🙏", `/pro/missions/${m.id}`);
          }
        }
      } else {
        m.tip = tip;
      }
    } else if (action === "signQuote") {
      if (m.clientId !== user.id) throw new Error("FORBIDDEN");
      if (!m.quoteId) throw new Error("INVALID_STATE");
      if (!db.quotes) db.quotes = [];
      const quote = db.quotes.find((q) => q.id === m.quoteId);
      if (!quote || quote.status !== "sent") throw new Error("INVALID_STATE");
      quote.status = "signed";
      quote.signedAt = now;
      m.price = quote.total;
      const missionPro = m.proId ? db.pros.find((p) => p.id === m.proId) : null;
      if (missionPro) {
        const proUser = db.users.find((u) => u.id === missionPro.userId);
        if (proUser) {
          notify(db, proUser.id, "Devis signé", `Le client a accepté le devis (${quote.total} €)`, `/pro/missions/${m.id}`);
        }
      }
    } else if (action === "rejectQuote") {
      if (m.clientId !== user.id) throw new Error("FORBIDDEN");
      if (!m.quoteId) throw new Error("INVALID_STATE");
      if (!db.quotes) db.quotes = [];
      const quote = db.quotes.find((q) => q.id === m.quoteId);
      if (!quote || quote.status !== "sent") throw new Error("INVALID_STATE");
      quote.status = "rejected";
      const missionPro = m.proId ? db.pros.find((p) => p.id === m.proId) : null;
      if (missionPro) {
        const proUser = db.users.find((u) => u.id === missionPro.userId);
        if (proUser) {
          notify(db, proUser.id, "Devis refusé", "Le client a refusé le devis", `/pro/missions/${m.id}`);
        }
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
      const missionPro = m.proId ? db.pros.find((p) => p.id === m.proId) : null;
      if (missionPro) {
        const total = missionPro.rating * missionPro.reviewCount + rating;
        missionPro.reviewCount += 1;
        missionPro.rating = Math.round((total / missionPro.reviewCount) * 10) / 10;
        missionPro.loyaltyBadge = computeLoyaltyBadge(missionPro);
        const proUser = db.users.find((u) => u.id === missionPro.userId);
        if (proUser) notify(db, proUser.id, "Nouvel avis", `${rating}/5 — ${String(payload.comment ?? "")}`, `/pro/profil`);
      }
    } else if (action === "cancel") {
      if (m.clientId !== user.id && user.role !== "admin") throw new Error("FORBIDDEN");
      if (["completed", "cancelled"].includes(m.status)) throw new Error("INVALID_STATE");
      m.status = "cancelled";
      m.timeline.push({ status: "cancelled", at: now, label: "Mission annulée" });
    } else if (action === "dispute") {
      if (m.clientId !== user.id && !(pro && m.proId === pro.id)) throw new Error("FORBIDDEN");
      if (["cancelled", "searching", "offered", "unmatched"].includes(m.status)) throw new Error("INVALID_STATE");
      if (db.disputes.some((d) => d.missionId === m.id && d.status !== "resolved" && d.status !== "closed")) {
        throw new Error("DISPUTE_EXISTS");
      }
      const reason = String(payload.reason ?? "Litige").trim() || "Litige";
      const category = (["qualite", "prix", "retard", "comportement", "autre"] as const).includes(
        payload.category as any,
      )
        ? (payload.category as "qualite" | "prix" | "retard" | "comportement" | "autre")
        : "autre";
      m.status = "disputed";
      m.timeline.push({ status: "disputed", at: now, label: "Litige ouvert" });
      const dispute = {
        id: nid("dsp"),
        missionId: m.id,
        openedBy: user.id,
        reason,
        category,
        status: "open" as const,
        messages: [
          {
            id: nid("dmsg"),
            authorId: user.id,
            role: (user.role === "pro" ? "pro" : "client") as "client" | "pro",
            text: reason,
            createdAt: now,
          },
        ],
        resolution: null,
        resolvedAt: null,
        refundSuggested: false,
        createdAt: now,
        updatedAt: now,
      };
      db.disputes.unshift(dispute);
      const admin = db.users.find((u) => u.role === "admin");
      if (admin) notify(db, admin.id, "Nouveau litige", reason, "/admin/litiges");
      if (m.proId) {
        const p = db.pros.find((x) => x.id === m.proId);
        if (p && p.userId !== user.id) notify(db, p.userId, "Litige ouvert", reason, `/pro/missions/${m.id}`);
      }
      if (m.clientId !== user.id) notify(db, m.clientId, "Litige ouvert", reason, `/app/support/${dispute.id}`);
    } else {
      throw new Error("UNKNOWN_ACTION");
    }

    return enrichMission(db, m, userId);
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

    if (patch.action === "subscribePremium" || patch.action === "subscribePrime") {
      if (pro.status !== "verified") throw new Error("NOT_VERIFIED");
      const plan = patch.plan === "yearly" ? "yearly" : "monthly";
      const settings = withTierSettings(db.settings);
      const amount =
        plan === "yearly"
          ? settings.primeYearlyPrice ?? settings.premiumYearlyPrice
          : settings.primeMonthlyPrice ?? settings.premiumMonthlyPrice;
      const until = extendPrimeUntil(pro.primeUntil || pro.premiumUntil, plan);
      pro.primeUntil = until;
      pro.premiumUntil = until;
      pro.primePlan = plan;
      pro.premiumPlan = plan;
      pro.subscriptionTier = "prime";
      // Simulated marketplace payment (no card charge)
      db.payments.unshift({
        id: nid("pay"),
        missionId: `prime_${pro.id}`,
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
        "AppO Prime activé",
        plan === "yearly"
          ? "Vous êtes Prime 12 mois : priorités matching + avantages Elite-ready."
          : "Vous êtes Prime 30 jours : priorités matching + mise en avant.",
        "/pro/premium",
      );
      return {
        pro,
        premiumActive: true,
        premiumDaysLeft: primeDaysLeft(pro),
        primeDaysLeft: primeDaysLeft(pro),
        tier: effectiveTier(pro),
        amount,
        plan,
      };
    }

    if (patch.action === "buyBoost") {
      if (pro.status !== "verified") throw new Error("NOT_VERIFIED");
      const plan = patch.plan === "7d" ? "7d" : "24h";
      const settings = withTierSettings(db.settings);
      const hours = plan === "7d" ? 168 : 24;
      const amount = plan === "7d" ? settings.boost7dPrice : settings.boost24hPrice;
      pro.boostUntil = extendBoostUntil(pro.boostUntil, hours);
      db.payments.unshift({
        id: nid("pay"),
        missionId: `boost_${pro.id}`,
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
        "Boost activé",
        plan === "7d" ? "Votre profil est boosté 7 jours." : "Votre profil est boosté 24 h.",
        "/pro/premium",
      );
      return {
        pro,
        boostActive: true,
        boostUntil: pro.boostUntil,
        amount,
        plan,
      };
    }

    if (patch.action === "setBusiness") {
      pro.businessEnabled = Boolean(patch.businessEnabled);
      if (pro.businessEnabled && (!pro.team || pro.team.length === 0)) {
        const ownerUser = db.users.find((u) => u.id === pro.userId);
        pro.team = [
          {
            id: nid("tm"),
            name: ownerUser ? `${ownerUser.firstName} ${ownerUser.lastName}`.trim() : pro.company,
            phone: ownerUser?.phone ?? "",
            role: "owner",
            active: true,
          },
        ];
      }
      return { pro };
    }

    if (patch.action === "addTeamMember") {
      if (!pro.businessEnabled) throw new Error("BUSINESS_DISABLED");
      const name = String(patch.name ?? "").trim();
      const phone = String(patch.phone ?? "").trim();
      if (!name || !phone) throw new Error("INVALID_MEMBER");
      if (!pro.team) pro.team = [];
      const member = {
        id: nid("tm"),
        name,
        phone,
        role: "intervenant" as const,
        active: true,
      };
      pro.team.push(member);
      return { pro, member };
    }

    if (patch.action === "removeTeamMember") {
      const memberId = String(patch.memberId ?? "");
      if (!pro.team) pro.team = [];
      const member = pro.team.find((t) => t.id === memberId);
      if (!member) throw new Error("NOT_FOUND");
      if (member.role === "owner") throw new Error("FORBIDDEN");
      pro.team = pro.team.filter((t) => t.id !== memberId);
      for (const mission of db.missions) {
        if (mission.proId === pro.id && mission.assigneeMemberId === memberId) {
          mission.assigneeMemberId = null;
        }
      }
      return { pro };
    }

    if (patch.action === "assignMission") {
      const missionId = String(patch.missionId ?? "");
      const memberId = String(patch.memberId ?? "");
      const mission = db.missions.find((x) => x.id === missionId && x.proId === pro.id);
      if (!mission) throw new Error("NOT_FOUND");
      if (!pro.businessEnabled) throw new Error("BUSINESS_DISABLED");
      const member = (pro.team ?? []).find((t) => t.id === memberId && t.active);
      if (!member) throw new Error("NOT_FOUND");
      mission.assigneeMemberId = member.id;
      return { pro, mission: enrichMission(db, mission) };
    }

    if (patch.action === "createQuote") {
      const missionId = String(patch.missionId ?? "");
      const mission = db.missions.find((x) => x.id === missionId && x.proId === pro.id);
      if (!mission) throw new Error("NOT_FOUND");
      const rawLines = Array.isArray(patch.lines) ? patch.lines : [];
      const lines: QuoteLine[] = rawLines
        .map((l) => {
          const row = l as { label?: unknown; amount?: unknown };
          return {
            label: String(row.label ?? "").trim(),
            amount: Number(row.amount ?? 0),
          };
        })
        .filter((l) => l.label && Number.isFinite(l.amount));
      if (!lines.length) throw new Error("INVALID_QUOTE");
      const total = Math.round(lines.reduce((a, l) => a + l.amount, 0) * 100) / 100;
      if (!db.quotes) db.quotes = [];
      const quote = {
        id: nid("qte"),
        missionId: mission.id,
        proId: pro.id,
        clientId: mission.clientId,
        lines,
        total,
        status: "sent" as const,
        note: patch.note ? String(patch.note) : undefined,
        createdAt: new Date().toISOString(),
        sentAt: new Date().toISOString(),
        signedAt: null,
      };
      db.quotes.push(quote);
      mission.quoteId = quote.id;
      notify(
        db,
        mission.clientId,
        "Nouveau devis",
        `${pro.company} vous a envoyé un devis de ${total} €`,
        `/app/missions/${mission.id}`,
      );
      return { pro, quote, mission: enrichMission(db, mission) };
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
    const settings = withTierSettings(db.settings);
    const myMissions = db.missions.filter((m) => m.proId === pro.id);
    const missionsCompleted = myMissions.filter((m) => m.status === "completed").length;
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
    const offeredOrAssigned = db.missions.filter(
      (m) => m.proId === pro.id || m.candidateProIds.includes(pro.id) || m.offerProId === pro.id,
    ).length;
    const quotes = (db.quotes ?? []).filter((q) => q.proId === pro.id);
    return {
      today: sum(today),
      week: sum(week),
      month: sum(month),
      grossMonth: gross(month),
      feesMonth: fees(month),
      commissionPaidMonth: fees(month),
      averageBasket: pays.length ? gross(0) / pays.length : 0,
      conversionRate: offeredOrAssigned ? missionsCompleted / offeredOrAssigned : 0,
      missionsCompleted,
      reviewCount: pro.reviewCount,
      upcoming: db.missions
        .filter((m) => m.proId === pro.id && m.status === "completed" && m.paymentStatus === "pending")
        .reduce((a, m) => a + (m.price + m.supplement) * (1 - m.commissionRate), 0),
      payments: pays.sort((a, b) => (b.paidAt ?? "").localeCompare(a.paidAt ?? "")),
      missions: myMissions.length,
      rating: pro.rating,
      online: pro.online,
      availability: availabilitySnapshot(db, pro),
      absences: pro.absences ?? [],
      bufferMinutes: pro.bufferMinutes,
      leadTimeHours: pro.leadTimeHours,
      maxMissionsPerDay: pro.maxMissionsPerDay,
      schedule: pro.schedule,
      premiumActive: isPrimeActive(pro),
      premiumUntil: pro.premiumUntil,
      premiumPlan: pro.premiumPlan,
      premiumDaysLeft: primeDaysLeft(pro),
      primeUntil: pro.primeUntil,
      primePlan: pro.primePlan,
      primeDaysLeft: primeDaysLeft(pro),
      subscriptionTier: pro.subscriptionTier ?? "pro",
      tier: effectiveTier(pro),
      boostActive: isBoostActive(pro),
      boostUntil: pro.boostUntil,
      loyaltyBadge: computeLoyaltyBadge(pro),
      loyaltyPoints: pro.loyaltyPoints ?? 0,
      quotes: quotes.length,
      quotesList: quotes.slice(0, 20),
      team: pro.team ?? [],
      businessEnabled: !!pro.businessEnabled,
      verifiedComplete: verifiedComplete(pro),
      premium: settings,
      settings,
      offer: (() => {
        if (!canReceiveNowOffer(db, pro)) return null;
        const raw = db.missions.find((m) => m.offerProId === pro.id && m.status === "offered") ?? null;
        return raw ? enrichMission(db, raw) : null;
      })(),
      offerStats: (() => {
        const mine = (db.offers ?? []).filter((o) => o.proId === pro.id);
        const accepted = mine.filter((o) => o.status === "accepted").length;
        return {
          total: mine.length,
          accepted,
          pending: mine.filter((o) => o.status === "pending").length,
          rejected: mine.filter((o) => o.status === "rejected").length,
          winRate: mine.length ? accepted / mine.length : 0,
          avgPrice: mine.length ? mine.reduce((a, o) => a + o.price, 0) / mine.length : 0,
        };
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
        const force = Boolean(payload.force);
        if (!force) {
          const need = ["identite", "entreprise", "assurance"] as const;
          const allApproved = need.every((t) =>
            pro.documents.some((d) => d.type === t && d.status === "approved"),
          );
          if (!allApproved) throw new Error("DOCS_INCOMPLETE");
        } else {
          for (const t of ["identite", "entreprise", "assurance"] as const) {
            let doc = pro.documents.find((d) => d.type === t);
            if (!doc) {
              doc = {
                id: nid("doc"),
                type: t,
                name: `${t}.pdf`,
                status: "approved",
                rejectReason: null,
                submittedAt: new Date().toISOString(),
                reviewedAt: new Date().toISOString(),
              };
              pro.documents.push(doc);
            } else {
              doc.status = "approved";
              doc.rejectReason = null;
              doc.reviewedAt = new Date().toISOString();
            }
          }
        }
        pro.status = "verified";
        pro.verified = true;
        pro.verificationNote = payload.note ? String(payload.note) : pro.verificationNote ?? null;
        notify(db, pro.userId, "Compte Pro vérifié", "Votre badge Pro vérifié est activé. Vous pouvez recevoir des missions.", "/pro", { emailPro: true });
      } else if (decision === "rejected") {
        pro.status = "rejected";
        pro.verified = false;
        pro.online = false;
        pro.verificationNote = String(payload.reason ?? payload.note ?? "Dossier incomplet");
        notify(db, pro.userId, "Inscription refusée", pro.verificationNote, "/pro/verification", { emailPro: true });
      } else if (decision === "suspended") {
        pro.status = "suspended";
        pro.online = false;
        pro.verified = false;
      }
      return { ...pro, checklist: verificationChecklist(pro), verifiedComplete: verifiedComplete(pro) };
    }
    if (action === "reviewDocument") {
      const pro = db.pros.find((p) => p.id === payload.proId);
      if (!pro) throw new Error("NOT_FOUND");
      const doc = pro.documents.find((d) => d.id === payload.documentId || d.type === payload.type);
      if (!doc) throw new Error("NOT_FOUND");
      const decision = String(payload.decision);
      const ts = new Date().toISOString();
      if (decision === "approved") {
        doc.status = "approved";
        doc.rejectReason = null;
        doc.reviewedAt = ts;
      } else if (decision === "rejected") {
        doc.status = "rejected";
        doc.rejectReason = String(payload.reason ?? "Document non conforme");
        doc.reviewedAt = ts;
        pro.verified = false;
        if (pro.status === "verified") pro.status = "pending";
      } else throw new Error("INVALID_STATE");
      notify(
        db,
        pro.userId,
        decision === "approved" ? "Document validé" : "Document refusé",
        `${doc.type}${doc.rejectReason ? ` — ${doc.rejectReason}` : ""}`,
        "/pro/verification",
      );
      return { ...pro, checklist: verificationChecklist(pro), verifiedComplete: verifiedComplete(pro) };
    }
    if (action === "suspendUser") {
      const user = db.users.find((u) => u.id === payload.userId);
      if (!user) throw new Error("NOT_FOUND");
      user.suspended = Boolean(payload.suspended);
      return publicUserMasked(user);
    }
    if (action === "revealClientPii") {
      const user = db.users.find((u) => u.id === payload.userId);
      if (!user || user.role !== "client") throw new Error("NOT_FOUND");
      console.info(
        JSON.stringify({
          ts: new Date().toISOString(),
          level: "audit",
          event: "admin_reveal_client_pii",
          adminId: userId,
          targetUserId: user.id,
        }),
      );
      return { user: publicUser(user), revealedAt: new Date().toISOString() };
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
      if (payload.primeMonthlyPrice != null) db.settings.primeMonthlyPrice = Number(payload.primeMonthlyPrice);
      if (payload.primeYearlyPrice != null) db.settings.primeYearlyPrice = Number(payload.primeYearlyPrice);
      if (payload.eliteExclusiveSeconds != null) {
        db.settings.eliteExclusiveSeconds = Number(payload.eliteExclusiveSeconds);
      }
      if (payload.primeExclusiveSeconds != null) {
        db.settings.primeExclusiveSeconds = Number(payload.primeExclusiveSeconds);
      }
      if (payload.boost24hPrice != null) db.settings.boost24hPrice = Number(payload.boost24hPrice);
      if (payload.boost7dPrice != null) db.settings.boost7dPrice = Number(payload.boost7dPrice);
      if (payload.urgenceCommissionBonus != null) {
        db.settings.urgenceCommissionBonus = Number(payload.urgenceCommissionBonus);
      }
      if (payload.urgencePriceMultiplier != null) {
        db.settings.urgencePriceMultiplier = Number(payload.urgencePriceMultiplier);
      }
      if (payload.commissionPrime != null) db.settings.commissionPrime = Number(payload.commissionPrime);
      if (payload.commissionElite != null) db.settings.commissionElite = Number(payload.commissionElite);
      if (payload.rfqPrimeExclusiveMinutes != null) {
        db.settings.rfqPrimeExclusiveMinutes = Number(payload.rfqPrimeExclusiveMinutes);
      }
      if (payload.rfqExpiresHours != null) {
        db.settings.rfqExpiresHours = Number(payload.rfqExpiresHours);
      }
      if (payload.commissionClientPlus != null) {
        db.settings.commissionClientPlus = Number(payload.commissionClientPlus);
      }
      if (payload.proEmailDailyLimit != null) {
        db.settings.proEmailDailyLimit = Math.max(1, Math.min(500, Number(payload.proEmailDailyLimit)));
      }
      return withMailSettings(db.settings);
    }
    if (action === "promoteProEmails") {
      const promoted = promotePendingProEmails(db);
      return { ...promoted, quota: mailQuotaSnapshot(db) };
    }
    if (action === "grantPrime") {
      const pro = db.pros.find((p) => p.id === payload.proId);
      if (!pro) throw new Error("NOT_FOUND");
      const days = Math.max(1, Number(payload.days ?? 30));
      const base =
        pro.primeUntil && new Date(pro.primeUntil).getTime() > Date.now()
          ? new Date(pro.primeUntil)
          : new Date();
      base.setDate(base.getDate() + days);
      pro.primeUntil = base.toISOString();
      pro.premiumUntil = pro.primeUntil;
      pro.subscriptionTier = "prime";
      pro.primePlan = "monthly";
      notify(db, pro.userId, "AppO Prime offert", `${days} jours Prime activés par l’admin`, "/pro/premium");
      return { ...pro, tier: effectiveTier(pro), premiumActive: true };
    }
    if (action === "grantBoost") {
      const pro = db.pros.find((p) => p.id === payload.proId);
      if (!pro) throw new Error("NOT_FOUND");
      const hours = Math.max(1, Number(payload.hours ?? 24));
      pro.boostUntil = extendBoostUntil(pro.boostUntil, hours);
      notify(db, pro.userId, "Boost offert", `Boost ${hours}h activé par l’admin`, "/pro/premium");
      return { ...pro, boostActive: true, boostUntil: pro.boostUntil };
    }
    if (action === "setElite") {
      const pro = db.pros.find((p) => p.id === payload.proId);
      if (!pro) throw new Error("NOT_FOUND");
      const elite = Boolean(payload.elite);
      pro.loyaltyBadge = elite ? "elite" : pro.loyaltyBadge === "elite" ? "gold" : pro.loyaltyBadge;
      if (elite) {
        pro.missionCount = Math.max(pro.missionCount, 40);
        pro.rating = Math.max(pro.rating, 4.7);
        pro.acceptanceRate = Math.max(pro.acceptanceRate, 0.85);
      }
      notify(
        db,
        pro.userId,
        elite ? "AppO Elite activé" : "Badge Elite retiré",
        elite ? "Priorité maximale sur le matching." : "Votre statut a été mis à jour.",
        "/pro/premium",
      );
      return { ...pro, tier: effectiveTier(pro), loyaltyBadge: computeLoyaltyBadge(pro) };
    }
    if (action === "cancelMission") {
      const m = db.missions.find((x) => x.id === payload.missionId);
      if (!m) throw new Error("NOT_FOUND");
      if (["completed", "cancelled"].includes(m.status)) throw new Error("INVALID_STATE");
      m.status = "cancelled";
      m.timeline.push({ status: "cancelled", at: new Date().toISOString(), label: "Annulée par admin" });
      notify(db, m.clientId, "Mission annulée", "Un administrateur a annulé la mission.", `/app/missions/${m.id}`);
      return enrichMission(db, m);
    }
    if (action === "resolveDispute") {
      const d = db.disputes.find((x) => x.id === payload.id);
      if (!d) throw new Error("NOT_FOUND");
      const ts = new Date().toISOString();
      const resolution = String(payload.resolution ?? "Litige résolu par AppO").trim();
      d.status = payload.close ? "closed" : "resolved";
      d.resolution = resolution;
      d.resolvedAt = ts;
      d.updatedAt = ts;
      d.refundSuggested = Boolean(payload.refundSuggested);
      if (!d.messages) d.messages = [];
      d.messages.push({
        id: nid("dmsg"),
        authorId: userId,
        role: "admin",
        text: resolution,
        createdAt: ts,
      });
      const m = db.missions.find((x) => x.id === d.missionId);
      if (m && m.status === "disputed") {
        m.status = "completed";
        m.timeline.push({ status: "completed", at: ts, label: "Litige résolu" });
      }
      if (payload.refund && m) {
        const p = db.payments.find((x) => x.missionId === m.id && x.status === "paid");
        if (p) {
          p.status = "refunded";
          m.paymentStatus = "refunded";
        }
      }
      notify(db, d.openedBy, "Litige résolu", resolution, `/app/support/${d.id}`);
      if (m) {
        notify(db, m.clientId, "Litige résolu", resolution, `/app/support/${d.id}`);
        if (m.proId) {
          const pro = db.pros.find((x) => x.id === m.proId);
          if (pro) notify(db, pro.userId, "Litige résolu", resolution, `/pro/missions/${m.id}`);
        }
      }
      return d;
    }
    if (action === "resolveTicket") {
      const t = (db.supportTickets ?? []).find((x) => x.id === payload.id);
      if (!t) throw new Error("NOT_FOUND");
      const ts = new Date().toISOString();
      const resolution = String(payload.resolution ?? "Ticket clos").trim();
      t.status = payload.close ? "closed" : "resolved";
      t.updatedAt = ts;
      t.messages.push({
        id: nid("dmsg"),
        authorId: userId,
        role: "admin",
        text: resolution,
        createdAt: ts,
      });
      notify(db, t.userId, "Ticket résolu", resolution, `/app/support/${t.id}`);
      return t;
    }
    if (action === "refund") {
      const p = db.payments.find((x) => x.id === payload.paymentId);
      if (!p) throw new Error("NOT_FOUND");
      p.status = "refunded";
      const m = db.missions.find((x) => x.id === p.missionId);
      if (m) m.paymentStatus = "refunded";
      return p;
    }
    if (action === "exportBackup") {
      return {
        ...db,
        users: db.users.map((full) => {
          const { passwordHash: _p, ...u } = full;
          const masked = publicUserMasked(full);
          return {
            ...u,
            phone: u.phone ? "[encrypted-at-rest]" : "",
            email: full.role === "client" ? masked.email : u.email,
          };
        }),
        addresses: db.addresses.map((a) => ({ ...a, line: "[encrypted-at-rest]" })),
        exportedAt: new Date().toISOString(),
      };
    }
    if (action === "reset") {
      if (payload.confirm !== "RESET") throw new Error("CONFIRM_REQUIRED");
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
    users: db.users.map(publicUserMasked),
    pros: db.pros.map((p) => ({
      ...p,
      user: publicUserMasked(db.users.find((u) => u.id === p.userId)!),
      premiumActive: isPrimeActive(p),
      boostActive: isBoostActive(p),
      tier: effectiveTier(p),
      verifiedComplete: verifiedComplete(p),
      checklist: verificationChecklist(p),
      docsReadyForReview: docsReadyForReview(p),
      loyaltyBadge: computeLoyaltyBadge(p),
    })),
    missions: db.missions.map((m) => enrichMission(db, m)),
    payments: db.payments,
    quotes: db.quotes ?? [],
    invoices: db.invoices ?? [],
    disputes: db.disputes.map((d) => ({
      ...d,
      mission: db.missions.find((m) => m.id === d.missionId),
    })),
    supportTickets: db.supportTickets ?? [],
    categories: db.categories,
    settings: withMailSettings(withTierSettings(db.settings)),
    mail: mailQuotaSnapshot(db),
    outboundEmails: (db.outboundEmails ?? []).slice(0, 40).map((e) => ({
      ...e,
      to: e.to.replace(/(.{2}).+(@.+)/, "$1***$2"),
    })),
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
    ACCOUNT_DELETED: 403,
    PRIVACY_CONSENT_REQUIRED: 400,
    INVALID_PRICE: 400,
    INVALID_DATE: 400,
    INVALID_STATE: 409,
    ORG_REQUIRED: 400,
    ADDRESS_REQUIRED: 400,
    PHOTO_TOO_LARGE: 400,
    INVALID_LOCATION: 400,
    FILE_TOO_LARGE: 400,
    INVALID_FILE_TYPE: 400,
    FILE_REQUIRED: 400,
    CONFIRM_REQUIRED: 400,
    RATE_LIMITED: 429,
    CONTACTS_LOCKED: 403,
    PLUS_REQUIRED: 403,
    NOT_VERIFIED: 403,
    DISPUTE_EXISTS: 409,
    MESSAGE_REQUIRED: 400,
    DOCS_INCOMPLETE: 400,
  };
  return { status: map[msg] ?? 400, error: msg };
}

export { publicUser };
export type { Role };

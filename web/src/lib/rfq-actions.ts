import {
  enrichMission,
  ensureInvoice,
  mutate,
  nid,
  notify,
  proByUser,
  publicUser,
  requireUser,
} from "./db";
import { commissionForPro, effectiveTier, withTierSettings } from "./premium";
import {
  canProSeeRequest,
  enrichOffersForClient,
  matchRfqPros,
  withRfqSettings,
} from "./rfq";
import type { DB, Mission, ProOffer, ServiceRequest } from "./types";
import { holdClientFunds } from "./escrow";
import { normalizePhotoUrls } from "./uploads";

function expireOpenRequests(db: DB, now = Date.now()) {
  for (const r of db.requests ?? []) {
    if (r.status === "open" && new Date(r.expiresAt).getTime() <= now) {
      r.status = "expired";
      for (const o of db.offers ?? []) {
        if (o.requestId === r.id && o.status === "pending") o.status = "withdrawn";
      }
      notify(
        db,
        r.clientId,
        "Demande expirée",
        "Aucune offre n’a été retenue avant l’échéance. Republiez si besoin.",
        `/app/demandes/${r.id}`,
      );
      for (const o of db.offers ?? []) {
        if (o.requestId !== r.id) continue;
        const pro = db.pros.find((p) => p.id === o.proId);
        if (pro) {
          notify(db, pro.userId, "Demande expirée", "L’appel d’offres est clos.", "/pro/demandes");
        }
      }
    }
  }
}

export async function createServiceRequest(
  userId: string,
  input: {
    categoryId: string;
    description: string;
    photos?: string[];
    address: string;
    city: string;
    lat: number;
    lng: number;
    availabilityNote: string;
    preferredAt?: string | null;
    isLargeWorks?: boolean;
  },
) {
  return mutate((db) => {
    const user = requireUser(db, userId, "client");
    const category = db.categories.find((c) => c.id === input.categoryId);
    if (!category?.active) throw new Error("INVALID_CATEGORY");
    if (!String(input.address || "").trim() || !String(input.city || "").trim()) {
      throw new Error("ADDRESS_REQUIRED");
    }
    const settings = withRfqSettings(withTierSettings(db.settings));
    const now = new Date();
    const matched = matchRfqPros(db, input.categoryId, input.lat, input.lng);
    const candidateProIds = matched.map((m) => m.pro.id);
    const primeOnlyUntil = new Date(
      now.getTime() + settings.rfqPrimeExclusiveMinutes * 60 * 1000,
    ).toISOString();
    const expiresAt = new Date(
      now.getTime() + settings.rfqExpiresHours * 3600 * 1000,
    ).toISOString();

    const req: ServiceRequest = {
      id: nid("req"),
      clientId: user.id,
      categoryId: input.categoryId,
      description: input.description,
      photos: normalizePhotoUrls(input.photos),
      address: input.address,
      city: input.city,
      lat: input.lat,
      lng: input.lng,
      availabilityNote: input.availabilityNote || "À convenir",
      preferredAt: input.preferredAt ?? null,
      status: "open",
      candidateProIds,
      awardedOfferId: null,
      missionId: null,
      primeOnlyUntil,
      broadcastDone: false,
      createdAt: now.toISOString(),
      expiresAt,
      isLargeWorks: Boolean(input.isLargeWorks),
    };
    if (!db.requests) db.requests = [];
    if (!db.offers) db.offers = [];
    db.requests.unshift(req);

    for (const { pro } of matched) {
      const tier = effectiveTier(pro);
      if (tier === "prime" || tier === "elite") {
        notify(
          db,
          pro.userId,
          "Nouvelle demande — accès prioritaire",
          `${category.name} · ${input.city} · ${input.availabilityNote}`,
          `/pro/demandes/${req.id}`,
          { emailPro: true },
        );
      }
    }

    return enrichRequest(db, req, user.id);
  });
}

function enrichRequest(db: DB, req: ServiceRequest, viewerId: string) {
  const category = db.categories.find((c) => c.id === req.categoryId);
  const client = db.users.find((u) => u.id === req.clientId);
  const offers = (db.offers ?? []).filter((o) => o.requestId === req.id);
  const viewer = db.users.find((u) => u.id === viewerId);
  const isClient = viewer?.id === req.clientId;
  const pro = viewer ? proByUser(db, viewer.id) : null;

  const visibleOffers = isClient
    ? enrichOffersForClient(db, req, offers)
    : pro
      ? offers.filter((o) => o.proId === pro.id)
      : [];

  const primeWindowOpen = Date.now() < new Date(req.primeOnlyUntil).getTime();

  return {
    ...req,
    category,
    client: client ? publicUser(client) : null,
    offers: visibleOffers,
    offerCount: offers.filter((o) => o.status === "pending").length,
    primeWindowOpen,
    myOffer: pro ? offers.find((o) => o.proId === pro.id) ?? null : null,
  };
}

export async function listServiceRequests(userId: string) {
  return mutate((db) => {
    const user = requireUser(db, userId);
    expireOpenRequests(db);
    if (!db.requests) db.requests = [];
    if (user.role === "client") {
      return db.requests
        .filter((r) => r.clientId === user.id)
        .map((r) => enrichRequest(db, r, user.id));
    }
    if (user.role === "pro") {
      const pro = proByUser(db, user.id);
      if (!pro) return [];
      return db.requests
        .filter((r) => canProSeeRequest(pro, r))
        .map((r) => enrichRequest(db, r, user.id));
    }
    return db.requests.map((r) => enrichRequest(db, r, user.id));
  }, true);
}

export async function getServiceRequest(userId: string, id: string) {
  return mutate((db) => {
    const user = requireUser(db, userId);
    expireOpenRequests(db);
    const req = (db.requests ?? []).find((r) => r.id === id);
    if (!req) throw new Error("NOT_FOUND");
    if (user.role === "client" && req.clientId !== user.id) throw new Error("FORBIDDEN");
    if (user.role === "pro") {
      const pro = proByUser(db, user.id);
      if (!pro || !canProSeeRequest(pro, req)) {
        // Allow viewing if they already submitted an offer even after award
        const hasOffer = (db.offers ?? []).some((o) => o.requestId === req.id && o.proId === pro?.id);
        if (!hasOffer && req.clientId !== user.id) throw new Error("FORBIDDEN");
      }
    }
    return enrichRequest(db, req, user.id);
  }, true);
}

export async function submitProOffer(
  userId: string,
  requestId: string,
  input: {
    price: number;
    proposedAt: string;
    durationMinutes: number;
    message: string;
    materialsIncluded: "yes" | "no" | "partial";
    materialsNote?: string;
  },
) {
  return mutate((db) => {
    const user = requireUser(db, userId, "pro");
    const pro = proByUser(db, user.id);
    if (!pro || pro.status !== "verified") throw new Error("NOT_VERIFIED");
    expireOpenRequests(db);
    const req = (db.requests ?? []).find((r) => r.id === requestId);
    if (!req || req.status !== "open") throw new Error("INVALID_STATE");
    if (!canProSeeRequest(pro, req)) throw new Error("FORBIDDEN");
    if (!input.price || input.price <= 0) throw new Error("INVALID_PRICE");
    if (!input.proposedAt) throw new Error("INVALID_DATE");

    if (!db.offers) db.offers = [];
    const existing = db.offers.find((o) => o.requestId === requestId && o.proId === pro.id && o.status === "pending");
    if (existing) {
      existing.price = Number(input.price);
      existing.proposedAt = input.proposedAt;
      existing.durationMinutes = Number(input.durationMinutes) || 60;
      existing.message = String(input.message || "");
      existing.materialsIncluded = input.materialsIncluded;
      existing.materialsNote = input.materialsNote;
      notify(
        db,
        req.clientId,
        "Offre mise à jour",
        `${user.firstName} a modifié son offre · ${existing.price} €`,
        `/app/demandes/${req.id}`,
      );
      return enrichRequest(db, req, user.id);
    }

    const offer: ProOffer = {
      id: nid("off"),
      requestId,
      proId: pro.id,
      price: Number(input.price),
      proposedAt: input.proposedAt,
      durationMinutes: Number(input.durationMinutes) || 60,
      message: String(input.message || ""),
      materialsIncluded: input.materialsIncluded,
      materialsNote: input.materialsNote,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    db.offers.unshift(offer);
    notify(
      db,
      req.clientId,
      "Nouvelle offre reçue",
      `${user.firstName} propose ${offer.price} € · ${req.city}`,
      `/app/demandes/${req.id}`,
    );
    return enrichRequest(db, req, user.id);
  });
}

export async function selectProOffer(userId: string, requestId: string, offerId: string) {
  return mutate((db) => {
    const user = requireUser(db, userId, "client");
    const req = (db.requests ?? []).find((r) => r.id === requestId);
    if (!req || req.clientId !== user.id) throw new Error("FORBIDDEN");
    if (req.status !== "open") throw new Error("INVALID_STATE");
    const offer = (db.offers ?? []).find((o) => o.id === offerId && o.requestId === requestId);
    if (!offer || offer.status !== "pending") throw new Error("NOT_FOUND");
    const pro = db.pros.find((p) => p.id === offer.proId);
    if (!pro) throw new Error("NOT_FOUND");
    const settings = withTierSettings(db.settings);
    const now = new Date().toISOString();

    for (const o of db.offers ?? []) {
      if (o.requestId !== requestId) continue;
      o.status = o.id === offerId ? "accepted" : o.status === "pending" ? "rejected" : o.status;
    }
    req.status = "awarded";
    req.awardedOfferId = offer.id;

    const clientUser = db.users.find((u) => u.id === user.id);
    const mission: Mission = {
      id: nid("mis"),
      type: "scheduled",
      clientId: user.id,
      proId: pro.id,
      categoryId: req.categoryId,
      status: "accepted",
      address: req.address,
      city: req.city,
      lat: req.lat,
      lng: req.lng,
      description: req.description,
      photos: req.photos,
      scheduledAt: offer.proposedAt,
      price: offer.price,
      supplement: 0,
      pendingSupplement: null,
      pendingSupplementReason: null,
      pendingNegotiatePrice: null,
      pendingNegotiateNote: null,
      tip: 0,
      commissionRate: commissionForPro(pro, settings, false, clientUser),
      createdAt: now,
      timeline: [{ status: "accepted", at: now, label: "Offre acceptée — mission confirmée" }],
      candidateProIds: [pro.id],
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
      isLargeWorks: Boolean(req.isLargeWorks),
    };
    db.missions.unshift(mission);
    req.missionId = mission.id;
    const held = holdClientFunds(db, mission, now, "card");
    ensureInvoice(db, mission, now);
    notify(
      db,
      user.id,
      "Paiement sécurisé chez Appo",
      `${held.amount} € prélevés. Appo conserve ce montant jusqu’à la fin de l’intervention.`,
      `/app/missions/${mission.id}`,
    );

    const proUser = db.users.find((u) => u.id === pro.userId);
    if (proUser) {
      notify(
        db,
        proUser.id,
        "Votre offre a été choisie 🎉",
        `Le client a accepté votre proposition (${offer.price} €)`,
        `/pro/missions/${mission.id}`,
        { emailPro: true },
      );
    }
    for (const o of db.offers ?? []) {
      if (o.requestId !== requestId || o.id === offerId) continue;
      const other = db.pros.find((p) => p.id === o.proId);
      if (other) {
        notify(
          db,
          other.userId,
          "Offre non retenue",
          "Le client a choisi une autre proposition.",
          `/pro/demandes`,
        );
      }
    }

    return { request: enrichRequest(db, req, user.id), mission: enrichMission(db, mission, userId) };
  });
}

export async function cancelServiceRequest(userId: string, requestId: string) {
  return mutate((db) => {
    const user = requireUser(db, userId, "client");
    const req = (db.requests ?? []).find((r) => r.id === requestId);
    if (!req || req.clientId !== user.id) throw new Error("FORBIDDEN");
    if (req.status !== "open") throw new Error("INVALID_STATE");
    req.status = "cancelled";
    for (const o of db.offers ?? []) {
      if (o.requestId === requestId && o.status === "pending") o.status = "withdrawn";
    }
    return enrichRequest(db, req, user.id);
  });
}

export async function proOfferStats(userId: string) {
  return mutate((db) => {
    requireUser(db, userId, "pro");
    const pro = proByUser(db, userId);
    if (!pro) throw new Error("NOT_FOUND");
    const mine = (db.offers ?? []).filter((o) => o.proId === pro.id);
    const accepted = mine.filter((o) => o.status === "accepted").length;
    const pending = mine.filter((o) => o.status === "pending").length;
    const rejected = mine.filter((o) => o.status === "rejected").length;
    const winRate = mine.length ? accepted / mine.length : 0;
    const avgPrice =
      mine.length ? mine.reduce((a, o) => a + o.price, 0) / mine.length : 0;
    return {
      total: mine.length,
      accepted,
      pending,
      rejected,
      winRate,
      avgPrice,
      tier: effectiveTier(pro),
      earlyAccess: effectiveTier(pro) === "prime" || effectiveTier(pro) === "elite",
    };
  }, false);
}

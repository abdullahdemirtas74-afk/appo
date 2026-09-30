import { runAssistant } from "./assistant";
import {
  acceptedProductsTotal,
  applyPromoToAmount,
  createGuarantee,
  creditWallet,
  findActivePromo,
  makeReferralCode,
  matchSlotPromo,
  nextRecurringDate,
  withGrowthSettings,
} from "./growth";
import {
  enrichMission,
  ensureInvoice,
  mutate,
  nid,
  notify,
  proByUser,
  requireUser,
} from "./db";
import { syncEscrowAmount } from "./escrow";
import type { Mission, MissionProduct, PromoCode, RecurringPlan, SlotPromo } from "./types";

export async function growthOverview(userId: string) {
  return mutate((db) => {
    const user = requireUser(db, userId);
    const settings = withGrowthSettings(db.settings);
    return {
      walletBalance: user.walletBalance ?? 0,
      referralCode: user.referralCode || makeReferralCode(user),
      ledgers: (db.walletLedgers ?? []).filter((l) => l.userId === user.id).slice(0, 40),
      referrals: (db.referrals ?? []).filter((r) => r.referrerUserId === user.id),
      recurringPlans: (db.recurringPlans ?? []).filter((p) => p.clientId === user.id),
      guarantees:
        user.role === "admin"
          ? db.guarantees ?? []
          : (db.guarantees ?? []).filter((g) => g.clientId === user.id),
      products: (db.products ?? []).filter((p) => p.active),
      promoCodes: user.role === "admin" ? db.promoCodes ?? [] : (db.promoCodes ?? []).filter((p) => p.active),
      wallets:
        user.role === "admin"
          ? db.users
              .filter((u) => u.role === "client" || u.role === "pro")
              .map((u) => ({
                id: u.id,
                name: `${u.firstName} ${u.lastName}`,
                email: u.email,
                walletBalance: u.walletBalance ?? 0,
                referralCode: u.referralCode,
              }))
          : [],
      slotPromos:
        user.role === "pro"
          ? (db.slotPromos ?? []).filter((s) => {
              const pro = proByUser(db, user.id);
              return pro && s.proId === pro.id;
            })
          : user.role === "admin"
            ? db.slotPromos ?? []
            : [],
      settings: {
        referralClientCredit: settings.referralClientCredit,
        referralProCredit: settings.referralProCredit,
        guaranteeRate: settings.guaranteeRate,
        guaranteeDays: settings.guaranteeDays,
        defaultSlotPromoPercent: settings.defaultSlotPromoPercent,
      },
    };
  }, true);
}

export async function growthAction(userId: string, action: string, payload: Record<string, unknown> = {}) {
  return mutate((db) => {
    const user = requireUser(db, userId);
    const settings = withGrowthSettings(db.settings);
    const now = new Date().toISOString();

    if (action === "assistant") {
      return runAssistant({
        text: String(payload.text ?? ""),
        history: Array.isArray(payload.history) ? (payload.history as { role: string; text: string }[]) : [],
      });
    }

    if (action === "applyReferralCode") {
      if (user.referredByUserId) throw new Error("ALREADY_REFERRED");
      const code = String(payload.code ?? "").trim().toUpperCase();
      const referrer = db.users.find((u) => (u.referralCode || "").toUpperCase() === code && u.id !== user.id);
      if (!referrer) throw new Error("INVALID_CODE");
      user.referredByUserId = referrer.id;
      if (!db.referrals) db.referrals = [];
      db.referrals.unshift({
        id: nid("ref"),
        code,
        referrerUserId: referrer.id,
        referredUserId: user.id,
        status: "signed_up",
        rewardAmount: referrer.role === "pro" ? settings.referralProCredit : settings.referralClientCredit,
        createdAt: now,
        rewardedAt: null,
      });
      const welcome = referrer.role === "pro" ? settings.referralProCredit : settings.referralClientCredit;
      creditWallet(db, user.id, Math.round(welcome / 2), "referral", `Bienvenue via ${code}`);
      notify(db, referrer.id, "Nouveau filleul", `${user.firstName} a utilisé votre code ${code}`, user.role === "pro" ? "/pro/profil" : "/app/compte");
      return { ok: true, walletBalance: user.walletBalance };
    }

    if (action === "redeemPromo") {
      const missionId = String(payload.missionId ?? "");
      const m = db.missions.find((x) => x.id === missionId);
      if (!m || m.clientId !== user.id) throw new Error("FORBIDDEN");
      if (m.promoCodeId) throw new Error("PROMO_ALREADY");
      const promo = findActivePromo(db, String(payload.code ?? ""), m.city);
      if (!promo) throw new Error("INVALID_PROMO");
      const base = m.price + (m.supplement ?? 0);
      const discount = applyPromoToAmount(promo, base);
      m.promoCodeId = promo.id;
      m.promoDiscount = discount;
      promo.redemptionCount += 1;
      if (!db.promoRedemptions) db.promoRedemptions = [];
      db.promoRedemptions.unshift({
        id: nid("prm"),
        promoCodeId: promo.id,
        userId: user.id,
        missionId: m.id,
        amount: discount,
        createdAt: now,
      });
      syncEscrowAmount(db, m);
      ensureInvoice(db, m, now);
      notify(db, user.id, "Code promo appliqué", `−${discount} € sur la mission`, `/app/missions/${m.id}`);
      return enrichMission(db, m, userId);
    }

    if (action === "useWalletCredit") {
      const missionId = String(payload.missionId ?? "");
      const m = db.missions.find((x) => x.id === missionId);
      if (!m || m.clientId !== user.id) throw new Error("FORBIDDEN");
      const want = Math.max(0, Number(payload.amount ?? 0));
      const balance = user.walletBalance ?? 0;
      const maxUsable = Math.min(balance, m.price + (m.supplement ?? 0) - (m.promoDiscount ?? 0));
      const use = Math.min(want || maxUsable, maxUsable);
      if (use <= 0) throw new Error("NO_CREDIT");
      creditWallet(db, user.id, -use, "debit_mission", `Crédit utilisé sur mission`, m.id);
      m.walletCreditUsed = (m.walletCreditUsed ?? 0) + use;
      m.promoDiscount = (m.promoDiscount ?? 0) + use;
      syncEscrowAmount(db, m);
      ensureInvoice(db, m, now);
      return enrichMission(db, m, userId);
    }

    if (action === "addGuarantee") {
      const missionId = String(payload.missionId ?? "");
      const m = db.missions.find((x) => x.id === missionId);
      if (!m || m.clientId !== user.id) throw new Error("FORBIDDEN");
      if (m.guaranteeId) throw new Error("ALREADY");
      if (!["accepted", "en_route", "arrived", "in_progress", "completed"].includes(m.status) && m.status !== "offered") {
        // allow from accepted onward; also searching/offered for demo flexibility after create
      }
      const g = createGuarantee(db, m, settings);
      creditWallet(db, user.id, 0, "avoir", `Garantie AppO ${g.premium} € (simulée)`, m.id);
      notify(db, user.id, "Garantie AppO activée", `Couverture ${g.coverageAmount} € · ${settings.guaranteeDays} jours`, `/app/missions/${m.id}`);
      return { guarantee: g, mission: enrichMission(db, m, userId) };
    }

    if (action === "claimGuarantee") {
      const id = String(payload.id ?? "");
      const g = (db.guarantees ?? []).find((x) => x.id === id);
      if (!g || g.clientId !== user.id) throw new Error("FORBIDDEN");
      if (g.status !== "active") throw new Error("INVALID_STATE");
      g.status = "claimed";
      g.claimStatus = "open";
      g.claimReason = String(payload.reason ?? "Problème après intervention").trim();
      notify(db, user.id, "Demande de garantie ouverte", g.claimReason, "/app/support");
      const admin = db.users.find((u) => u.role === "admin");
      if (admin) notify(db, admin.id, "Claim garantie", g.claimReason, "/admin/garanties");
      return g;
    }

    if (action === "createRecurring") {
      requireUser(db, userId, "client");
      const frequency = (["weekly", "biweekly", "monthly"] as const).includes(payload.frequency as any)
        ? (payload.frequency as RecurringPlan["frequency"])
        : "weekly";
      const plan: RecurringPlan = {
        id: nid("rec"),
        clientId: user.id,
        categoryId: String(payload.categoryId ?? "cat_menage"),
        addressId: payload.addressId ? String(payload.addressId) : null,
        address: String(payload.address ?? "").trim() || "Adresse à confirmer",
        city: String(payload.city ?? "Rumilly"),
        lat: Number(payload.lat ?? 45.8782),
        lng: Number(payload.lng ?? 6.0581),
        frequency,
        preferredDay: Math.max(0, Math.min(6, Number(payload.preferredDay ?? 2))),
        preferredHour: String(payload.preferredHour ?? "10:00"),
        description: String(payload.description ?? "Prestation récurrente"),
        price: Math.max(1, Number(payload.price ?? 45)),
        proId: payload.proId ? String(payload.proId) : null,
        active: true,
        nextAt: now,
        createdAt: now,
      };
      plan.nextAt = nextRecurringDate(plan, new Date());
      if (!db.recurringPlans) db.recurringPlans = [];
      db.recurringPlans.unshift(plan);
      return plan;
    }

    if (action === "toggleRecurring") {
      const plan = (db.recurringPlans ?? []).find((p) => p.id === payload.id && p.clientId === user.id);
      if (!plan) throw new Error("NOT_FOUND");
      plan.active = Boolean(payload.active);
      return plan;
    }

    if (action === "runRecurringNow") {
      // generate next occurrence as scheduled mission searching
      const plan = (db.recurringPlans ?? []).find((p) => p.id === payload.id && (p.clientId === user.id || user.role === "admin"));
      if (!plan || !plan.active) throw new Error("NOT_FOUND");
      const mission = {
        id: nid("mis"),
        type: "scheduled" as const,
        clientId: plan.clientId,
        proId: plan.proId,
        categoryId: plan.categoryId,
        status: plan.proId ? ("offered" as const) : ("searching" as const),
        address: plan.address,
        city: plan.city,
        lat: plan.lat,
        lng: plan.lng,
        description: plan.description,
        photos: [] as string[],
        scheduledAt: plan.nextAt,
        price: plan.price,
        supplement: 0,
        pendingSupplement: null,
        pendingSupplementReason: null,
        pendingNegotiatePrice: null,
        pendingNegotiateNote: null,
        tip: 0,
        commissionRate: settings.commissionRate,
        createdAt: now,
        timeline: [] as { status: string; at: string; label: string }[],
        candidateProIds: plan.proId ? [plan.proId] : [],
        declinedProIds: [] as string[],
        offerProId: plan.proId,
        offerExpiresAt: null,
        etaMinutes: null,
        startProLat: null,
        startProLng: null,
        paymentStatus: "none" as const,
        paymentMethod: null,
        assigneeMemberId: null,
        quoteId: null,
        invoiceId: null,
        isLargeWorks: false,
        recurringPlanId: plan.id,
        promoDiscount: 0,
        slotPromoId: null as string | null,
      } as Mission;
      if (plan.proId) {
        const slot = matchSlotPromo(db, plan.proId, new Date(plan.nextAt));
        if (slot) {
          mission.slotPromoId = slot.id;
          mission.promoDiscount = Math.round(mission.price * (slot.percentOff / 100) * 100) / 100;
        }
      }
      db.missions.unshift(mission);
      plan.nextAt = nextRecurringDate(plan, new Date(plan.nextAt));
      notify(db, plan.clientId, "Prestation récurrente créée", plan.description, `/app/missions/${mission.id}`);
      return { plan, mission: enrichMission(db, mission, userId) };
    }

    if (action === "upsertSlotPromo") {
      const pro = proByUser(db, user.id);
      if (!pro) throw new Error("FORBIDDEN");
      const id = payload.id ? String(payload.id) : null;
      let slot = id ? (db.slotPromos ?? []).find((s) => s.id === id && s.proId === pro.id) : null;
      if (!slot) {
        slot = {
          id: nid("slot"),
          proId: pro.id,
          day: payload.day == null || payload.day === "" ? null : Number(payload.day),
          start: String(payload.start ?? "14:00"),
          end: String(payload.end ?? "17:00"),
          percentOff: Math.max(5, Math.min(30, Number(payload.percentOff ?? settings.defaultSlotPromoPercent))),
          active: true,
          createdAt: now,
        } as SlotPromo;
        if (!db.slotPromos) db.slotPromos = [];
        db.slotPromos.unshift(slot);
      } else {
        if (payload.day !== undefined) slot.day = payload.day == null || payload.day === "" ? null : Number(payload.day);
        if (payload.start) slot.start = String(payload.start);
        if (payload.end) slot.end = String(payload.end);
        if (payload.percentOff != null) slot.percentOff = Math.max(5, Math.min(30, Number(payload.percentOff)));
        if (typeof payload.active === "boolean") slot.active = payload.active;
      }
      return slot;
    }

    if (action === "proposeProduct") {
      const pro = proByUser(db, user.id);
      if (!pro) throw new Error("FORBIDDEN");
      const missionId = String(payload.missionId ?? "");
      const m = db.missions.find((x) => x.id === missionId && x.proId === pro.id);
      if (!m) throw new Error("NOT_FOUND");
      const product = (db.products ?? []).find((p) => p.id === payload.productId && p.active);
      if (!product) throw new Error("PRODUCT_NOT_FOUND");
      const row: MissionProduct = {
        id: nid("mprd"),
        missionId: m.id,
        productId: product.id,
        quantity: Math.max(1, Number(payload.quantity ?? 1)),
        unitPrice: product.price,
        status: "proposed",
        proposedByProId: pro.id,
        createdAt: now,
      };
      if (!db.missionProducts) db.missionProducts = [];
      db.missionProducts.unshift(row);
      notify(
        db,
        m.clientId,
        "Produit proposé",
        `${product.brand} ${product.model} · ${product.price} €`,
        `/app/missions/${m.id}`,
      );
      return { product: row, catalog: product };
    }

    if (action === "respondProduct") {
      const row = (db.missionProducts ?? []).find((p) => p.id === payload.id);
      if (!row) throw new Error("NOT_FOUND");
      const m = db.missions.find((x) => x.id === row.missionId);
      if (!m || m.clientId !== user.id) throw new Error("FORBIDDEN");
      const accept = Boolean(payload.accept);
      row.status = accept ? "accepted" : "rejected";
      if (accept) {
        const extra = acceptedProductsTotal(db, m.id);
        // fold into supplement for escrow/invoice simplicity
        m.supplement = Math.round((m.supplement + row.unitPrice * row.quantity) * 100) / 100;
        void extra;
        syncEscrowAmount(db, m);
        ensureInvoice(db, m, now);
      }
      const pro = m.proId ? db.pros.find((p) => p.id === m.proId) : null;
      if (pro) {
        notify(
          db,
          pro.userId,
          accept ? "Produit accepté" : "Produit refusé",
          accept ? `+${row.unitPrice * row.quantity} €` : "Le client a refusé la pièce",
          `/pro/missions/${m.id}`,
        );
      }
      return { product: row, mission: enrichMission(db, m, userId) };
    }

    if (action === "adminCreatePromo") {
      requireUser(db, userId, "admin");
      const promo: PromoCode = {
        id: nid("promo"),
        code: String(payload.code ?? "").trim().toUpperCase(),
        type: payload.type === "fixed" ? "fixed" : "percent",
        value: Number(payload.value ?? 10),
        maxRedemptions: Math.max(1, Number(payload.maxRedemptions ?? 100)),
        redemptionCount: 0,
        expiresAt: payload.expiresAt ? String(payload.expiresAt) : null,
        active: true,
        city: payload.city ? String(payload.city) : null,
        createdAt: now,
      };
      if (!promo.code) throw new Error("INVALID_CODE");
      if (!db.promoCodes) db.promoCodes = [];
      db.promoCodes.unshift(promo);
      return promo;
    }

    if (action === "adminWalletAdjust") {
      requireUser(db, userId, "admin");
      const targetId = String(payload.userId ?? "");
      const amount = Number(payload.amount ?? 0);
      const entry = creditWallet(db, targetId, amount, "admin", String(payload.label ?? "Ajustement admin"));
      if (!entry) throw new Error("NOT_FOUND");
      return entry;
    }

    if (action === "adminResolveGuarantee") {
      requireUser(db, userId, "admin");
      const g = (db.guarantees ?? []).find((x) => x.id === payload.id);
      if (!g) throw new Error("NOT_FOUND");
      const approve = Boolean(payload.approve);
      g.claimStatus = approve ? "approved" : "rejected";
      g.status = approve ? "claimed" : "expired";
      if (approve) {
        creditWallet(db, g.clientId, g.coverageAmount, "refund", "Remboursement garantie AppO", g.missionId);
      }
      notify(db, g.clientId, approve ? "Garantie approuvée" : "Garantie refusée", g.claimReason ?? "", "/app/wallet");
      return g;
    }

    throw new Error("UNKNOWN_ACTION");
  });
}

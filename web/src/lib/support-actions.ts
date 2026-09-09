import {
  enrichMission,
  mutate,
  nid,
  notify,
  proByUser,
  requireUser,
} from "./db";
import { verifiedComplete, verificationChecklist } from "./premium";
import type { Dispute, SupportTicket } from "./types";

function nowIso() {
  return new Date().toISOString();
}

function roleOf(db: Parameters<typeof requireUser>[0], userId: string): "client" | "pro" | "admin" {
  const u = db.users.find((x) => x.id === userId);
  if (u?.role === "admin") return "admin";
  if (u?.role === "pro") return "pro";
  return "client";
}

export async function listMySupport(userId: string) {
  return mutate((db) => {
    const user = requireUser(db, userId);
    const disputes = db.disputes
      .filter((d) => {
        const m = db.missions.find((x) => x.id === d.missionId);
        if (!m) return false;
        if (d.openedBy === user.id) return true;
        if (user.role === "client") return m.clientId === user.id;
        if (user.role === "pro") {
          const pro = proByUser(db, user.id);
          return Boolean(pro && m.proId === pro.id);
        }
        return false;
      })
      .map((d) => ({
        ...d,
        kind: "dispute" as const,
        mission: enrichMission(db, db.missions.find((m) => m.id === d.missionId)!, userId),
      }))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    const tickets = (db.supportTickets ?? [])
      .filter((t) => t.userId === user.id)
      .map((t) => ({ ...t, kind: "ticket" as const }))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    return { disputes, tickets };
  }, false);
}

export async function getSupportItem(userId: string, id: string) {
  return mutate((db) => {
    const user = requireUser(db, userId);
    const dispute = db.disputes.find((d) => d.id === id);
    if (dispute) {
      const m = db.missions.find((x) => x.id === dispute.missionId);
      if (!m) throw new Error("NOT_FOUND");
      const pro = user.role === "pro" ? proByUser(db, user.id) : null;
      const allowed =
        user.role === "admin" ||
        dispute.openedBy === user.id ||
        m.clientId === user.id ||
        (pro && m.proId === pro.id);
      if (!allowed) throw new Error("FORBIDDEN");
      return {
        kind: "dispute" as const,
        item: dispute,
        mission: enrichMission(db, m, userId),
      };
    }
    const ticket = (db.supportTickets ?? []).find((t) => t.id === id);
    if (!ticket) throw new Error("NOT_FOUND");
    if (user.role !== "admin" && ticket.userId !== user.id) throw new Error("FORBIDDEN");
    return { kind: "ticket" as const, item: ticket, mission: null };
  }, false);
}

export async function createSupportTicket(
  userId: string,
  input: {
    subject: string;
    category?: SupportTicket["category"];
    message: string;
    relatedMissionId?: string | null;
  },
) {
  return mutate((db) => {
    const user = requireUser(db, userId);
    if (user.role === "admin") throw new Error("FORBIDDEN");
    const subject = String(input.subject || "").trim();
    const message = String(input.message || "").trim();
    if (!subject || !message) throw new Error("MESSAGE_REQUIRED");
    if (!db.supportTickets) db.supportTickets = [];
    const ts = nowIso();
    const ticket: SupportTicket = {
      id: nid("tkt"),
      userId: user.id,
      subject,
      category: input.category ?? "autre",
      status: "open",
      relatedMissionId: input.relatedMissionId ?? null,
      messages: [
        {
          id: nid("dmsg"),
          authorId: user.id,
          role: roleOf(db, user.id),
          text: message,
          createdAt: ts,
        },
      ],
      createdAt: ts,
      updatedAt: ts,
    };
    db.supportTickets.unshift(ticket);
    const admin = db.users.find((u) => u.role === "admin");
    if (admin) {
      notify(db, admin.id, "Nouveau ticket support", subject, "/admin/litiges");
    }
    return ticket;
  });
}

export async function replySupport(
  userId: string,
  input: { id: string; text: string; kind?: "dispute" | "ticket" },
) {
  return mutate((db) => {
    const user = requireUser(db, userId);
    const text = String(input.text || "").trim();
    if (!text) throw new Error("MESSAGE_REQUIRED");
    const ts = nowIso();
    const msg = {
      id: nid("dmsg"),
      authorId: user.id,
      role: roleOf(db, user.id),
      text,
      createdAt: ts,
    };

    const dispute = db.disputes.find((d) => d.id === input.id);
    if (dispute && input.kind !== "ticket") {
      const m = db.missions.find((x) => x.id === dispute.missionId);
      if (!m) throw new Error("NOT_FOUND");
      const pro = user.role === "pro" ? proByUser(db, user.id) : null;
      const allowed =
        user.role === "admin" ||
        dispute.openedBy === user.id ||
        m.clientId === user.id ||
        (pro && m.proId === pro.id);
      if (!allowed) throw new Error("FORBIDDEN");
      if (dispute.status === "resolved" || dispute.status === "closed") throw new Error("INVALID_STATE");
      if (!dispute.messages) dispute.messages = [];
      dispute.messages.push(msg);
      dispute.updatedAt = ts;
      if (user.role === "admin" && dispute.status === "open") dispute.status = "in_review";
      const notifyIds = new Set<string>([dispute.openedBy, m.clientId]);
      if (m.proId) {
        const p = db.pros.find((x) => x.id === m.proId);
        if (p) notifyIds.add(p.userId);
      }
      for (const uid of notifyIds) {
        if (uid === user.id) continue;
        notify(db, uid, "Nouveau message litige", text.slice(0, 80), `/app/support/${dispute.id}`);
      }
      if (user.role !== "admin") {
        const admin = db.users.find((u) => u.role === "admin");
        if (admin) notify(db, admin.id, "Réponse litige", text.slice(0, 80), "/admin/litiges");
      }
      return { kind: "dispute" as const, item: dispute };
    }

    const ticket = (db.supportTickets ?? []).find((t) => t.id === input.id);
    if (!ticket) throw new Error("NOT_FOUND");
    if (user.role !== "admin" && ticket.userId !== user.id) throw new Error("FORBIDDEN");
    if (ticket.status === "resolved" || ticket.status === "closed") throw new Error("INVALID_STATE");
    ticket.messages.push(msg);
    ticket.updatedAt = ts;
    if (user.role === "admin" && ticket.status === "open") ticket.status = "in_review";
    if (user.role === "admin") {
      notify(db, ticket.userId, "Réponse support AppO", text.slice(0, 80), `/app/support/${ticket.id}`);
    } else {
      const admin = db.users.find((u) => u.role === "admin");
      if (admin) notify(db, admin.id, "Réponse ticket", ticket.subject, "/admin/litiges");
    }
    return { kind: "ticket" as const, item: ticket };
  });
}

export async function openMissionDispute(
  userId: string,
  missionId: string,
  input: { reason: string; category?: Dispute["category"] },
) {
  return mutate((db) => {
    const user = requireUser(db, userId);
    const m = db.missions.find((x) => x.id === missionId);
    if (!m) throw new Error("NOT_FOUND");
    const pro = user.role === "pro" ? proByUser(db, user.id) : null;
    if (m.clientId !== user.id && !(pro && m.proId === pro.id)) throw new Error("FORBIDDEN");
    if (["cancelled", "searching", "offered", "unmatched"].includes(m.status)) throw new Error("INVALID_STATE");
    if (db.disputes.some((d) => d.missionId === m.id && d.status !== "resolved" && d.status !== "closed")) {
      throw new Error("DISPUTE_EXISTS");
    }
    const reason = String(input.reason || "").trim();
    if (!reason) throw new Error("MESSAGE_REQUIRED");
    const ts = nowIso();
    m.status = "disputed";
    m.timeline.push({ status: "disputed", at: ts, label: "Litige ouvert" });
    const dispute: Dispute = {
      id: nid("dsp"),
      missionId: m.id,
      openedBy: user.id,
      reason,
      category: input.category ?? "autre",
      status: "open",
      messages: [
        {
          id: nid("dmsg"),
          authorId: user.id,
          role: roleOf(db, user.id),
          text: reason,
          createdAt: ts,
        },
      ],
      resolution: null,
      resolvedAt: null,
      refundSuggested: false,
      createdAt: ts,
      updatedAt: ts,
    };
    db.disputes.unshift(dispute);
    const admin = db.users.find((u) => u.role === "admin");
    if (admin) notify(db, admin.id, "Nouveau litige", reason.slice(0, 80), "/admin/litiges");
    if (m.clientId !== user.id) {
      notify(db, m.clientId, "Litige ouvert", reason.slice(0, 80), `/app/support/${dispute.id}`);
    }
    if (m.proId) {
      const p = db.pros.find((x) => x.id === m.proId);
      if (p && p.userId !== user.id) {
        notify(db, p.userId, "Litige ouvert", reason.slice(0, 80), `/pro/missions/${m.id}`);
      }
    }
    return { dispute, mission: enrichMission(db, m, userId) };
  });
}

export async function submitProDocument(
  userId: string,
  input: { type: "identite" | "entreprise" | "assurance" | "certification"; name?: string; url?: string },
) {
  return mutate((db) => {
    requireUser(db, userId, "pro");
    const pro = proByUser(db, userId);
    if (!pro) throw new Error("NOT_FOUND");
    const type = input.type;
    const name = String(input.name || `${type}.pdf`).trim() || `${type}.pdf`;
    const url = input.url ? String(input.url) : null;
    const ts = nowIso();
    let doc = pro.documents.find((d) => d.type === type);
    if (!doc) {
      doc = {
        id: nid("doc"),
        type,
        name,
        url,
        status: "pending",
        rejectReason: null,
        submittedAt: ts,
        reviewedAt: null,
      };
      pro.documents.push(doc);
    } else {
      doc.name = name;
      doc.url = url;
      doc.status = "pending";
      doc.rejectReason = null;
      doc.submittedAt = ts;
      doc.reviewedAt = null;
    }
    if (pro.status === "rejected") pro.status = "pending";
    pro.verified = false;
    return {
      pro,
      checklist: verificationChecklist(pro),
      verifiedComplete: verifiedComplete(pro),
    };
  });
}

export async function submitProVerification(userId: string) {
  return mutate((db) => {
    requireUser(db, userId, "pro");
    const pro = proByUser(db, userId);
    if (!pro) throw new Error("NOT_FOUND");
    const need = ["identite", "entreprise", "assurance"] as const;
    const ready = need.every((t) =>
      pro.documents.some((d) => d.type === t && (d.status === "pending" || d.status === "approved")),
    );
    if (!ready) throw new Error("DOCS_INCOMPLETE");
    const ts = nowIso();
    pro.verificationSubmittedAt = ts;
    if (pro.status === "rejected" || pro.status === "suspended") {
      /* stay until admin acts */
    } else {
      pro.status = "pending";
    }
    pro.verified = false;
    const admin = db.users.find((u) => u.role === "admin");
    if (admin) {
      notify(db, admin.id, "Dossier Pro à vérifier", `${pro.company} a soumis ses documents`, "/admin/pros");
    }
    notify(db, userId, "Dossier envoyé", "AppO examine vos documents sous 24–48h.", "/pro/verification");
    return {
      pro,
      checklist: verificationChecklist(pro),
      verifiedComplete: verifiedComplete(pro),
    };
  });
}

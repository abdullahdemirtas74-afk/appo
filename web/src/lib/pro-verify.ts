import type { ProProfile } from "./types";
import {
  docsReadyForReview,
  faceIdReady,
  PRO_REQUIRED_DOCS,
  readyForAutoVerify,
} from "./premium";
import { VERIFY_DELAY_MS } from "./siret";

/** Mark Face ID + CNI as verified and auto-approve those docs. */
export function completeFaceIdCheck(pro: ProProfile, method: "camera" | "upload" = "camera") {
  if (!faceIdReady(pro)) throw new Error("FACE_ID_INCOMPLETE");
  const ts = new Date().toISOString();
  for (const type of ["identite", "selfie"] as const) {
    const doc = pro.documents.find((d) => d.type === type);
    if (!doc || !doc.url) throw new Error("FACE_ID_INCOMPLETE");
    doc.status = "approved";
    doc.rejectReason = null;
    doc.reviewedAt = ts;
  }
  pro.faceIdVerifiedAt = ts;
  pro.faceIdMethod = method;
  if (pro.status === "rejected") pro.status = "pending";
  return pro;
}

/** Apply SIRET lookup result onto pro profile. */
export function applySiretLookup(
  pro: ProProfile,
  lookup: {
    ok: boolean;
    status: NonNullable<ProProfile["siretStatus"]>;
    siret: string;
    legalName: string | null;
    naf: string | null;
    address: string | null;
  },
) {
  pro.siret = lookup.siret;
  pro.siretStatus = lookup.status;
  pro.siretCheckedAt = new Date().toISOString();
  pro.siretLegalName = lookup.legalName;
  pro.siretNaf = lookup.naf;
  pro.siretAddress = lookup.address;
  if (lookup.ok && lookup.legalName && (!pro.company || pro.company.length < 2)) {
    pro.company = lookup.legalName;
  }
  return pro;
}

export function markVerificationSubmitted(pro: ProProfile) {
  const ts = new Date().toISOString();
  pro.verificationSubmittedAt = ts;
  pro.verificationDueAt = new Date(Date.now() + VERIFY_DELAY_MS).toISOString();
  if (pro.status !== "rejected" && pro.status !== "suspended") {
    pro.status = "pending";
  }
  pro.verified = false;
  return pro;
}

export function approveRequiredDocs(pro: ProProfile) {
  const ts = new Date().toISOString();
  for (const t of PRO_REQUIRED_DOCS) {
    let doc = pro.documents.find((d) => d.type === t);
    if (!doc) {
      doc = {
        id: `doc_${Math.random().toString(36).slice(2, 10)}`,
        type: t,
        name: `${t}.pdf`,
        status: "approved",
        url: null,
        rejectReason: null,
        submittedAt: ts,
        reviewedAt: ts,
      };
      pro.documents.push(doc);
    } else if (doc.status !== "approved") {
      doc.status = "approved";
      doc.rejectReason = null;
      doc.reviewedAt = ts;
    }
  }
}

export function hoursUntilConfirm(pro: ProProfile, now = Date.now()) {
  if (!pro.verificationDueAt) return null;
  const ms = new Date(pro.verificationDueAt).getTime() - now;
  return Math.max(0, Math.ceil(ms / 3600000));
}

export { docsReadyForReview, faceIdReady, readyForAutoVerify, PRO_REQUIRED_DOCS, VERIFY_DELAY_MS };

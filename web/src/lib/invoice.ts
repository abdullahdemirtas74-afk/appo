import type { DB, Invoice, InvoiceLine, InvoiceParty, Mission, Quote } from "./types";

const DEFAULT_VAT = 0.2;

export function splitTtc(totalTtc: number, vatRate = DEFAULT_VAT) {
  const amountHt = Math.round((totalTtc / (1 + vatRate)) * 100) / 100;
  const amountVat = Math.round((totalTtc - amountHt) * 100) / 100;
  return { amountHt, amountVat, vatRate };
}

function partyFromClient(db: DB, clientId: string, mission: Mission): InvoiceParty {
  const user = db.users.find((u) => u.id === clientId);
  const addr = db.addresses.find((a) => a.userId === clientId && a.isDefault) ?? db.addresses.find((a) => a.userId === clientId);
  const org =
    user?.clientKind && user.clientKind !== "particulier" && user.organizationName
      ? user.organizationName
      : null;
  return {
    name: org || `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "Client AppO",
    siret: user?.organizationSiret ?? null,
    address: mission.address || addr?.line || null,
    city: mission.city || addr?.city || null,
    zip: addr?.zip || null,
    email: user?.email ?? null,
    phone: user?.phone ?? null,
  };
}

function partyFromPro(db: DB, proId: string): InvoiceParty {
  const pro = db.pros.find((p) => p.id === proId);
  const user = pro ? db.users.find((u) => u.id === pro.userId) : null;
  return {
    name: pro?.company || `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "Professionnel AppO",
    siret: pro?.siret ?? null,
    address: null,
    city: pro?.city ?? null,
    zip: null,
    email: user?.email ?? null,
    phone: user?.phone ?? null,
  };
}

function linesForMission(db: DB, m: Mission, amountHt: number, vatRate: number, quote?: Quote | null): InvoiceLine[] {
  if (quote?.lines?.length) {
    return quote.lines.map((l) => ({
      label: l.label,
      quantity: 1,
      unitPriceHt: Math.round((l.amount / (1 + vatRate)) * 100) / 100,
      vatRate,
    }));
  }
  const category = db.categories.find((c) => c.id === m.categoryId);
  const baseLabel = category ? `Intervention ${category.name.toLowerCase()}` : "Intervention";
  const lines: InvoiceLine[] = [
    {
      label: m.description?.trim() ? `${baseLabel} — ${m.description.trim()}` : baseLabel,
      quantity: 1,
      unitPriceHt: amountHt,
      vatRate,
    },
  ];
  if (m.supplement > 0) {
    const suppHt = Math.round((m.supplement / (1 + vatRate)) * 100) / 100;
    lines[0].unitPriceHt = Math.round((amountHt - suppHt) * 100) / 100;
    lines.push({
      label: m.pendingSupplementReason?.trim() || "Supplément / pièces",
      quantity: 1,
      unitPriceHt: suppHt,
      vatRate,
    });
  }
  return lines;
}

/** Remplit les champs facture électronique (TVA, parties, lignes) sans casser le total TTC. */
export function applyElectronicInvoiceFields(db: DB, invoice: Invoice, m: Mission): Invoice {
  const vatRate = invoice.vatRate ?? DEFAULT_VAT;
  const { amountHt, amountVat } = splitTtc(invoice.total, vatRate);
  const quote = invoice.quoteId ? db.quotes.find((q) => q.id === invoice.quoteId) ?? null : null;
  invoice.currency = invoice.currency ?? "EUR";
  invoice.vatRate = vatRate;
  invoice.amountHt = amountHt;
  invoice.amountVat = amountVat;
  invoice.lines = invoice.lines?.length ? invoice.lines : linesForMission(db, m, amountHt, vatRate, quote);
  invoice.seller = invoice.seller ?? partyFromPro(db, invoice.proId);
  invoice.buyer = invoice.buyer ?? partyFromClient(db, invoice.clientId, m);
  invoice.paymentMethod = invoice.paymentMethod ?? m.paymentMethod ?? null;
  invoice.serviceAt =
    invoice.serviceAt ??
    m.timeline.find((t) => t.status === "completed")?.at ??
    m.scheduledAt ??
    m.createdAt;
  invoice.note =
    invoice.note ??
    "Facture électronique émise via la plateforme AppO. Paiement sécurisé (séquestre AppO). TVA sur prestations de services.";
  return invoice;
}

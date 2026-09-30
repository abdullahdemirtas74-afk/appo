"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Check, Lock, Phone, Star } from "lucide-react";
import { TrackingMap } from "@/components/map";
import { useMe } from "@/components/guard";
import { Badge, Button, Field, inputClass } from "@/components/ui";
import { api, usePoll } from "@/lib/hooks";
import { STATUS_LABELS, formatDate, formatTime, money } from "@/lib/format";

const STEPS = ["accepted", "en_route", "arrived", "in_progress", "completed"];
const TIP_PRESETS = [0, 2, 5, 10];

export default function MissionClientPage() {
  const { id } = useParams<{ id: string }>();
  const { data: me } = useMe();
  const { data, reload } = usePoll<{ mission: any }>(id ? `/api/missions/${id}` : null, 2000);
  const [text, setText] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [payMethod, setPayMethod] = useState("card");
  const [tip, setTip] = useState(0);
  const [promoCode, setPromoCode] = useState("");
  const [negoPrice, setNegoPrice] = useState("");
  const [negoNote, setNegoNote] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeCategory, setDisputeCategory] = useState("autre");
  const [showDispute, setShowDispute] = useState(false);
  const m = data?.mission;
  if (!m) return <div className="p-6 text-muted">Chargement…</div>;

  const act = async (action: string, extra: Record<string, unknown> = {}) => {
    await api(`/api/missions/${m.id}`, { action, ...extra });
    reload();
  };

  const searching = m.status === "searching" || m.status === "offered";
  const unlocked = Boolean(m.contactsUnlocked);
  const plus = Boolean(me?.clientPlusActive);
  const canNegotiate =
    plus &&
    unlocked &&
    m.paymentStatus !== "paid" &&
    m.pendingNegotiatePrice == null &&
    ["accepted", "en_route", "arrived", "in_progress"].includes(m.status);

  return (
    <div className="px-5 py-6 pb-10">
      {searching ? (
        <div className="py-10 text-center">
          <div className="relative mx-auto h-24 w-24">
            <div className="pulse-ring absolute inset-0 rounded-full bg-appo/40" />
            <div className="relative grid h-24 w-24 place-items-center rounded-full bg-appo text-2xl font-black text-white">O</div>
          </div>
          <h1 className="mt-6 text-xl font-extrabold">Recherche des professionnels…</h1>
          <p className="mt-2 text-sm text-muted">
            {m.type === "urgence"
              ? "Urgence ⚡ — AppO contacte les pros disponibles près de vous."
              : m.status === "offered"
                ? `Un pro a ${m.remainingOffer}s pour accepter`
                : "AppO sélectionne les professionnels vérifiés autour de vous."}
          </p>
          <div className="mx-auto mt-4 max-w-sm space-y-2">
            {m.status === "offered" ? (
              <div className="rounded-2xl bg-ink px-4 py-3 text-white">
                <div className="text-xs opacity-70">Offre en cours</div>
                <div className="text-3xl font-black tabular-nums">{m.remainingOffer}s</div>
              </div>
            ) : null}
            <p className="rounded-2xl bg-background px-4 py-3 text-sm text-muted">
              {m.contactedCount ?? 0} pro{(m.contactedCount ?? 0) > 1 ? "s" : ""} dans le matching
              {m.declinedProIds?.length ? ` · ${m.declinedProIds.length} passage(s)` : ""}
            </p>
            <p className="rounded-2xl bg-background px-4 py-3 text-xs text-muted">
              <Lock size={12} className="mr-1 inline" />
              Identité et téléphone restent masqués jusqu’à acceptation. Dès que le pro accepte, {money(m.total)} est prélevé et conservé par Appo jusqu’à la fin.
            </p>
            <Button
              className="w-full"
              variant="secondary"
              onClick={() => act("cancel")}
            >
              Annuler la recherche
            </Button>
          </div>
        </div>
      ) : m.status === "unmatched" ? (
        <div className="py-10 text-center">
          <h1 className="text-xl font-extrabold">Aucun professionnel disponible</h1>
          <p className="mt-2 text-sm text-muted">Essayez de comparer des offres ou de planifier.</p>
          <div className="mx-auto mt-6 flex max-w-sm flex-col gap-2">
            <Button href="/app/demandes/nouvelle" variant="now">
              Publier un besoin
            </Button>
            <Button href="/app/planifier" variant="secondary">
              Planifier
            </Button>
            <Button href="/app" variant="secondary">
              Retour à l’accueil
            </Button>
          </div>
        </div>
      ) : (
        <>
          <Badge tone="green">Mission confirmée ✅</Badge>
          <h1 className="mt-2 text-2xl font-extrabold">{m.category?.name}</h1>
          <p className="text-muted">{m.description}</p>
          {m.pro ? (
            <div className="mt-4 flex items-center justify-between rounded-3xl border border-line p-4">
              <div>
                <div className="font-bold">
                  {m.pro.user.firstName} {m.pro.user.lastName}
                </div>
                <div className="text-sm text-muted">{m.pro.company}</div>
                {m.live?.etaMinutes && m.status === "en_route" ? (
                  <div className="mt-1 text-sm font-semibold text-appo">
                    Arrive dans {m.live.etaMinutes} min
                  </div>
                ) : null}
              </div>
              <div className="flex gap-2">
                {unlocked ? (
                  <>
                    <a className="rounded-full border border-line p-2" href={`/app/missions/${m.id}#chat`}>
                      💬
                    </a>
                    {m.pro.user.phone ? (
                      <a className="rounded-full border border-line p-2" href={`tel:${m.pro.user.phone}`}>
                        <Phone size={16} />
                      </a>
                    ) : null}
                  </>
                ) : (
                  <span className="rounded-full border border-line p-2 text-muted">
                    <Lock size={16} />
                  </span>
                )}
              </div>
            </div>
          ) : null}
          <div className="mt-4">
            <TrackingMap
              destination={{ lat: m.lat, lng: m.lng }}
              pro={m.live ? { lat: m.live.lat, lng: m.live.lng } : null}
              etaMinutes={m.status === "en_route" ? m.live?.etaMinutes : null}
              label={m.address}
              unlocked={unlocked}
              source={m.live?.source}
            />
          </div>
          {m.photos?.length ? (
            <div className="mt-4 flex gap-2 overflow-x-auto">
              {m.photos.map((src: string) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={src} src={src} alt="" className="h-24 w-32 shrink-0 rounded-xl object-cover" />
              ))}
            </div>
          ) : null}
          <div className="mt-6 space-y-3">
            {STEPS.map((s) => {
              const done = STEPS.indexOf(m.status) >= STEPS.indexOf(s) && !["cancelled", "unmatched", "searching", "offered"].includes(m.status);
              const current = m.status === s;
              return (
                <div key={s} className="flex items-center gap-3 text-sm">
                  <span className={`grid h-7 w-7 place-items-center rounded-full ${done || current ? "bg-green text-white" : "bg-zinc-200"}`}>
                    <Check size={14} />
                  </span>
                  <span className={current ? "font-bold" : "text-muted"}>{STATUS_LABELS[s]}</span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {unlocked && !searching ? (
        <div className="mt-6 rounded-2xl border border-line p-4">
          <div className="text-sm text-muted">Prix affiché</div>
          <div className="text-2xl font-black">{money(m.total)}</div>
          {canNegotiate ? (
            <div className="mt-3 space-y-2 border-t border-line pt-3">
              <div className="text-sm font-bold">Négocier le prix (AppO+)</div>
              <Field label="Votre proposition (€)">
                <input
                  className={inputClass}
                  type="number"
                  value={negoPrice}
                  onChange={(e) => setNegoPrice(e.target.value)}
                  placeholder={`Moins de ${m.total}`}
                />
              </Field>
              <input
                className={inputClass}
                value={negoNote}
                onChange={(e) => setNegoNote(e.target.value)}
                placeholder="Message au pro (optionnel)"
              />
              <Button
                className="w-full"
                variant="secondary"
                onClick={() => act("negotiate", { price: Number(negoPrice), note: negoNote })}
                disabled={!negoPrice || Number(negoPrice) <= 0}
              >
                Envoyer la proposition
              </Button>
            </div>
          ) : !plus && unlocked && m.paymentStatus !== "paid" ? (
            <p className="mt-2 text-xs text-muted">
              Avec <Link className="font-semibold text-appo" href="/app/plus">AppO+</Link>, négociez le prix affiché par le pro.
            </p>
          ) : null}
          {m.pendingNegotiatePrice != null ? (
            <p className="mt-2 text-sm font-semibold text-appo">
              Proposition envoyée : {money(m.pendingNegotiatePrice)} — en attente du pro
            </p>
          ) : null}
        </div>
      ) : null}

      {m.quote && m.quote.status === "sent" ? (
        <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-4">
          <div className="font-bold">Devis à signer 🧾</div>
          <div className="mt-1 text-2xl font-black">{money(m.quote.total)}</div>
          <ul className="mt-2 space-y-1 text-sm">
            {(m.quote.lines ?? []).map((l: any, i: number) => (
              <li key={i} className="flex justify-between">
                <span>{l.label}</span>
                <b>{money(l.amount)}</b>
              </li>
            ))}
          </ul>
          <Button className="mt-3 w-full" variant="now" onClick={() => act("signQuote")}>
            Signer le devis
          </Button>
          <Button className="mt-2 w-full" variant="secondary" onClick={() => act("rejectQuote")}>
            Refuser
          </Button>
        </div>
      ) : null}

      {m.quote?.status === "signed" ? (
        <div className="mt-4 rounded-2xl border border-green/30 bg-emerald-50 p-3 text-sm">
          Devis signé · {money(m.quote.total)}
        </div>
      ) : null}

      {m.pendingSupplement != null ? (
        <div className="mt-6 rounded-3xl border border-orange-200 bg-orange-50 p-4">
          <div className="font-bold">Supplément demandé : +{m.pendingSupplement} €</div>
          <p className="text-sm">{m.pendingSupplementReason}</p>
          <Button className="mt-3 w-full" variant="now" onClick={() => act("respondSupplement", { accept: true })}>
            Accepter le nouveau prix
          </Button>
          <Button className="mt-2 w-full" variant="secondary" onClick={() => act("respondSupplement", { accept: false })}>
            Refuser
          </Button>
        </div>
      ) : null}

      {["held", "scheduled", "paid", "none", "pending"].includes(m.paymentStatus) &&
      ["accepted", "en_route", "arrived", "in_progress", "completed", "offered"].includes(m.status) ? (
        <div className="mt-6 space-y-3 rounded-3xl border border-line p-4">
          <div className="font-bold">Promo, wallet & garantie</div>
          {!m.promoCodeId ? (
            <div className="flex gap-2">
              <input
                className={inputClass}
                placeholder="Code promo (APPO10)"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
              />
              <Button
                variant="secondary"
                onClick={async () => {
                  await api("/api/growth", { action: "redeemPromo", missionId: m.id, code: promoCode });
                  reload();
                }}
              >
                Appliquer
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted">Promo appliquée : −{money(m.promoDiscount ?? 0)}</p>
          )}
          <Button
            variant="secondary"
            className="w-full"
            onClick={async () => {
              await api("/api/growth", { action: "useWalletCredit", missionId: m.id });
              reload();
            }}
          >
            Utiliser mon crédit Wallet
          </Button>
          {!m.guaranteeId ? (
            <Button
              className="w-full"
              onClick={async () => {
                await api("/api/growth", { action: "addGuarantee", missionId: m.id });
                reload();
              }}
            >
              Ajouter la garantie AppO
            </Button>
          ) : (
            <p className="text-sm text-muted">
              Garantie active · couverture {money(m.guarantee?.coverageAmount ?? m.total)}
            </p>
          )}
        </div>
      ) : null}

      {(m.products ?? []).length ? (
        <div className="mt-6 rounded-3xl border border-line p-4">
          <div className="font-bold">Produits proposés</div>
          <div className="mt-2 space-y-2">
            {(m.products ?? []).map((p: any) => (
              <div key={p.id} className="rounded-2xl bg-background px-3 py-2 text-sm">
                <div className="font-semibold">
                  {p.catalog?.brand} {p.catalog?.model} · {money(p.unitPrice)} × {p.quantity}
                </div>
                <div className="text-xs text-muted">
                  {p.catalog?.name} · {p.catalog?.quality} · {p.status}
                </div>
                {p.status === "proposed" ? (
                  <div className="mt-2 flex gap-2">
                    <Button
                      variant="now"
                      onClick={async () => {
                        await api("/api/growth", { action: "respondProduct", id: p.id, accept: true });
                        reload();
                      }}
                    >
                      Accepter
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={async () => {
                        await api("/api/growth", { action: "respondProduct", id: p.id, accept: false });
                        reload();
                      }}
                    >
                      Refuser
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {m.status === "completed" && m.invoice ? (
        <div className="mt-6 rounded-3xl border border-line p-4">
          <div className="font-bold">Facture électronique</div>
          <p className="text-sm text-muted">
            {m.invoice.number} · {money(m.invoice.total)}
            {m.invoice.tip ? ` + pourboire ${money(m.invoice.tip)}` : ""} ·{" "}
            {m.invoice.status === "paid" ? "payée" : "à régler"}
          </p>
          <Link
            href={`/app/factures/${m.invoice.id}`}
            className="mt-3 inline-flex text-sm font-semibold text-appo"
          >
            Ouvrir la facture →
          </Link>
        </div>
      ) : null}

      {["held", "scheduled", "paid"].includes(m.paymentStatus) ? (
        <div className="mt-6 rounded-3xl border border-line bg-card p-4">
          <div className="font-bold">Paiement sécurisé chez Appo</div>
          <p className="mt-1 text-sm text-muted">
            {m.paymentStatus === "held"
              ? `${money(m.payment?.amount ?? m.total)} prélevés à l’acceptation. Appo garde ce montant jusqu’à la fin de l’intervention, puis le verse au pro.`
              : m.paymentStatus === "scheduled"
                ? `Intervention terminée. Versement au pro le ${m.payment?.releaseAt ? formatDate(m.payment.releaseAt) : "date prévue"}.`
                : `Versé au professionnel${m.payment?.paidAt ? ` le ${formatDate(m.payment.paidAt)}` : ""}.`}
          </p>
        </div>
      ) : null}

      {m.status === "completed" && (m.paymentStatus === "none" || m.paymentStatus === "pending") ? (
        <div className="mt-6 rounded-3xl bg-ink p-5 text-white">
          <div className="text-sm opacity-70">Intervention terminée</div>
          <div className="text-3xl font-black">{money(m.total)}</div>
          <div className="mt-4">
            <div className="text-sm font-semibold">Pourboire (optionnel)</div>
            <div className="mt-2 grid grid-cols-4 gap-2 text-xs">
              {TIP_PRESETS.map((n) => (
                <button
                  key={n}
                  className={`rounded-xl py-2 ${tip === n ? "bg-appo" : "bg-white/10"}`}
                  onClick={() => setTip(n)}
                >
                  {n === 0 ? "0 €" : `+${n} €`}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
            {[["card", "Carte"], ["apple_pay", "Apple Pay"], ["google_pay", "Google Pay"]].map(([id, label]) => (
              <button key={id} className={`rounded-xl py-2 ${payMethod === id ? "bg-appo" : "bg-white/10"}`} onClick={() => setPayMethod(id)}>
                {label}
              </button>
            ))}
          </div>
          <Button className="mt-4 w-full" variant="now" onClick={() => act("pay", { method: payMethod, tip })}>
            Payer {money(m.total + tip)}
          </Button>
        </div>
      ) : null}

      {m.status === "completed" && ["held", "scheduled", "paid"].includes(m.paymentStatus) && !m.review ? (
        <div className="mt-6 rounded-3xl border border-line p-4">
          <h2 className="font-bold">Noter le professionnel</h2>
          <div className="mt-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setRating(n)}>
                <Star size={28} className={n <= rating ? "fill-amber-400 text-amber-400" : "text-zinc-300"} />
              </button>
            ))}
          </div>
          <textarea className={`${inputClass} mt-3`} rows={3} placeholder="Commentaire" value={comment} onChange={(e) => setComment(e.target.value)} />
          {!(m.tip > 0) ? (
            <div className="mt-3">
              <div className="text-sm font-semibold">Ajouter un pourboire</div>
              <div className="mt-2 flex gap-2">
                {[2, 5, 10].map((n) => (
                  <Button key={n} variant="secondary" onClick={() => act("tip", { amount: n })}>
                    +{n} €
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted">Pourboire : {money(m.tip)}</p>
          )}
          <Button className="mt-3 w-full" onClick={() => act("review", { rating, comment })}>
            Publier l’avis
          </Button>
        </div>
      ) : null}

      {["held", "scheduled", "paid"].includes(m.paymentStatus) ? (
        <div className="mt-4 rounded-2xl bg-background p-4 text-sm">
          {m.invoice ? (
            <>
              Facture {m.invoice.number} · {money(m.invoice.total)}
              {m.invoice.tip ? ` · pourboire ${money(m.invoice.tip)}` : ""} · payée
            </>
          ) : (
            <>
              Facture {m.id} · {money(m.total)} · {m.paymentMethod}
            </>
          )}
        </div>
      ) : null}

      {["accepted", "en_route", "arrived", "in_progress", "completed", "disputed"].includes(m.status) ? (
        <div className="mt-6 rounded-3xl border border-line p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-bold">Aide & litige</h2>
            {m.status === "disputed" ? <Badge tone="orange">Litige ouvert</Badge> : null}
          </div>
          {m.status === "disputed" ? (
            <div className="mt-2">
              <p className="text-sm text-muted">Un litige est en cours sur cette mission.</p>
              <Button className="mt-3" variant="secondary" href="/app/support">
                Suivre dans Aide & litiges
              </Button>
            </div>
          ) : showDispute ? (
            <div className="mt-3 space-y-2">
              <select className={inputClass} value={disputeCategory} onChange={(e) => setDisputeCategory(e.target.value)}>
                <option value="qualite">Qualité de l’intervention</option>
                <option value="prix">Prix / facturation</option>
                <option value="retard">Retard</option>
                <option value="comportement">Comportement</option>
                <option value="autre">Autre</option>
              </select>
              <textarea
                className={inputClass}
                rows={3}
                placeholder="Décrivez le problème…"
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  variant="now"
                  onClick={async () => {
                    await act("dispute", { reason: disputeReason, category: disputeCategory });
                    setShowDispute(false);
                  }}
                >
                  Ouvrir le litige
                </Button>
                <Button variant="secondary" onClick={() => setShowDispute(false)}>
                  Annuler
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-2 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setShowDispute(true)}>
                Signaler un problème
              </Button>
              <Button variant="secondary" href="/app/support">
                Contacter le support
              </Button>
            </div>
          )}
        </div>
      ) : null}

      {unlocked && m.pro ? (
        <div id="chat" className="mt-8">
          <h2 className="font-bold">Messages</h2>
          <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
            {(m.messages ?? []).map((msg: any) => (
              <div key={msg.id} className={`rounded-2xl px-3 py-2 text-sm ${msg.senderId === m.clientId ? "ml-8 bg-appo text-white" : "mr-8 bg-background"}`}>
                {msg.text}
                <div className="mt-1 text-[10px] opacity-70">{formatTime(msg.createdAt)}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input className={inputClass} value={text} onChange={(e) => setText(e.target.value)} placeholder="Votre message…" />
            <Button
              onClick={async () => {
                if (!text.trim()) return;
                await act("message", { text });
                setText("");
              }}
            >
              Envoyer
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

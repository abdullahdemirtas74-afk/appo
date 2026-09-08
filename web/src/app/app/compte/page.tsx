"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMe } from "@/components/guard";
import { Button, Field, inputClass } from "@/components/ui";
import { api, usePoll } from "@/lib/hooks";
import { money } from "@/lib/format";
import type { ClientKind } from "@/lib/types";

const KIND_LABEL: Record<ClientKind, string> = {
  particulier: "Particulier",
  entreprise: "Entreprise",
  syndicat: "Syndicat",
};

export default function ComptePage() {
  const router = useRouter();
  const { data: me, reload } = useMe();
  const { data: missionsData } = usePoll<{ missions: any[] }>("/api/missions", 0);
  const { data: favData } = usePoll<{ pros: any[] }>("/api/pros?favorites=1", 0);
  const user = me?.user;
  const kind = (user?.clientKind ?? "particulier") as ClientKind;
  const paid = (missionsData?.missions ?? []).filter((m) => m.paymentStatus === "paid" && m.invoice);
  const [section, setSection] = useState<"menu" | "profile" | "addresses" | "favorites" | "invoices">("menu");
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [msg, setMsg] = useState("");
  const [newAddr, setNewAddr] = useState({ label: "Autre", line: "", city: "Rumilly", zip: "74150" });

  async function saveProfile() {
    setMsg("");
    try {
      await api("/api/me", { firstName, lastName, phone });
      await reload();
      setMsg("Profil enregistré");
      setSection("menu");
    } catch {
      setMsg("Erreur");
    }
  }

  if (section === "profile") {
    return (
      <div className="px-5 py-6">
        <button className="text-sm font-semibold text-appo" onClick={() => setSection("menu")}>
          ← Retour
        </button>
        <h1 className="mt-2 text-2xl font-extrabold">Mes informations</h1>
        <div className="mt-4 space-y-3">
          <Field label="Prénom">
            <input className={inputClass} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </Field>
          <Field label="Nom">
            <input className={inputClass} value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </Field>
          <Field label="Téléphone">
            <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <p className="text-sm text-muted">{user?.email}</p>
          <Button className="w-full" variant="now" onClick={saveProfile}>
            Enregistrer
          </Button>
          {msg ? <p className="text-center text-sm text-muted">{msg}</p> : null}
        </div>
      </div>
    );
  }

  if (section === "addresses") {
    return (
      <div className="px-5 py-6">
        <button className="text-sm font-semibold text-appo" onClick={() => setSection("menu")}>
          ← Retour
        </button>
        <h1 className="mt-2 text-2xl font-extrabold">Mes adresses</h1>
        <div className="mt-4 space-y-2">
          {(me?.addresses ?? []).map((a) => (
            <button
              key={a.id}
              className={`flex w-full items-start justify-between rounded-2xl border px-4 py-3 text-left ${
                a.isDefault ? "border-appo bg-appo/5" : "border-line"
              }`}
              onClick={async () => {
                await api("/api/me", { action: "setDefaultAddress", addressId: a.id });
                await reload();
              }}
            >
              <div>
                <div className="font-semibold">{a.label}</div>
                <div className="text-sm text-muted">
                  {a.line}, {a.city}
                </div>
              </div>
              {a.isDefault ? <span className="text-xs font-bold text-appo">Défaut</span> : null}
            </button>
          ))}
        </div>
        <div className="mt-6 space-y-2 rounded-2xl border border-line p-4">
          <div className="font-bold">Ajouter une adresse</div>
          <input
            className={inputClass}
            placeholder="Libellé"
            value={newAddr.label}
            onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })}
          />
          <input
            className={inputClass}
            placeholder="Rue"
            value={newAddr.line}
            onChange={(e) => setNewAddr({ ...newAddr, line: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              className={inputClass}
              placeholder="Ville"
              value={newAddr.city}
              onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
            />
            <input
              className={inputClass}
              placeholder="CP"
              value={newAddr.zip}
              onChange={(e) => setNewAddr({ ...newAddr, zip: e.target.value })}
            />
          </div>
          <Button
            className="w-full"
            variant="secondary"
            disabled={!newAddr.line.trim()}
            onClick={async () => {
              await api("/api/me", { action: "addAddress", ...newAddr });
              setNewAddr({ label: "Autre", line: "", city: "Rumilly", zip: "74150" });
              await reload();
            }}
          >
            Ajouter
          </Button>
        </div>
      </div>
    );
  }

  if (section === "favorites") {
    const list = favData?.pros ?? [];
    return (
      <div className="px-5 py-6">
        <button className="text-sm font-semibold text-appo" onClick={() => setSection("menu")}>
          ← Retour
        </button>
        <h1 className="mt-2 text-2xl font-extrabold">Favoris</h1>
        <div className="mt-4 space-y-2">
          {list.length === 0 ? <p className="text-sm text-muted">Aucun favori pour l’instant.</p> : null}
          {list.map((p: any) => (
            <Link key={p.id} href={`/app/pros/${p.id}`} className="block rounded-2xl border border-line px-4 py-3">
              <div className="font-semibold">
                {p.user?.firstName} {p.user?.lastName} — {p.company}
              </div>
              <div className="text-sm text-muted">
                ⭐ {p.rating} · dès {money(p.startingPrice)}
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  if (section === "invoices") {
    return (
      <div className="px-5 py-6">
        <button className="text-sm font-semibold text-appo" onClick={() => setSection("menu")}>
          ← Retour
        </button>
        <h1 className="mt-2 text-2xl font-extrabold">Mes factures</h1>
        <div className="mt-4 space-y-2">
          {paid.length === 0 ? <p className="text-sm text-muted">Aucune facture pour l’instant.</p> : null}
          {paid.map((m: any) => (
            <Link key={m.id} href={`/app/missions/${m.id}`} className="block rounded-2xl border border-line px-4 py-3">
              <div className="font-semibold">
                {m.invoice?.number ?? m.id} · {money(m.invoice?.total ?? m.total)}
              </div>
              <div className="text-sm text-muted">
                {m.category?.name} · {m.invoice?.status === "paid" ? "Payée" : "Émise"}
                {m.tip ? ` · pourboire ${money(m.tip)}` : ""}
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-6">
      <h1 className="text-2xl font-extrabold">Mon compte</h1>
      <div className="mt-4 rounded-3xl bg-ink p-5 text-white">
        <div className="text-lg font-bold">
          {user?.firstName} {user?.lastName}
        </div>
        <div className="text-sm opacity-70">{user?.email}</div>
        <div className="mt-2 text-sm font-semibold text-white/90">
          {KIND_LABEL[kind]}
          {kind !== "particulier" && user?.organizationName ? ` · ${user.organizationName}` : ""}
        </div>
        {me?.clientPlusActive ? (
          <div className="mt-2 text-xs font-bold text-appo">AppO+ · {me.clientPlusDaysLeft} j restants</div>
        ) : null}
      </div>

      <div className="mt-4 space-y-2 text-sm">
        {[
          { k: "Mes informations", v: user ? `${user.firstName} ${user.lastName}` : "", onClick: () => setSection("profile") },
          { k: "Type de compte", v: KIND_LABEL[kind] },
          { k: "AppO+", v: me?.clientPlusActive ? `Actif · ${me.clientPlusDaysLeft} j` : "Voir l’offre", href: "/app/plus" },
          {
            k: "Mes adresses",
            v: me?.addresses?.map((a) => a.label).join(", ") || "—",
            onClick: () => setSection("addresses"),
          },
          { k: "Mes factures", v: `${paid.length} facture(s)`, onClick: () => setSection("invoices") },
          { k: "Professionnels favoris", v: `${me?.favorites?.length ?? 0}`, onClick: () => setSection("favorites") },
          { k: "Mes réservations", v: `${missionsData?.missions?.length ?? 0} missions`, href: "/app/missions" },
          { k: "Aide", v: "aide@appo.fr", href: "mailto:aide@appo.fr" },
        ].map((row) => {
          const inner = (
            <>
              <span className="font-semibold">{row.k}</span>
              <span className="max-w-[50%] truncate text-muted">{row.v}</span>
            </>
          );
          const cls = "flex w-full items-center justify-between rounded-2xl border border-line px-4 py-3 text-left";
          if (row.href) {
            return (
              <Link key={row.k} href={row.href} className={cls}>
                {inner}
              </Link>
            );
          }
          if (row.onClick) {
            return (
              <button key={row.k} type="button" className={cls} onClick={row.onClick}>
                {inner}
              </button>
            );
          }
          return (
            <div key={row.k} className={cls}>
              {inner}
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-muted">
        Conformité RGPD V1 : vous pouvez demander la suppression du compte. AppO ne stocke jamais de numéro de carte.
      </p>
      <Button
        className="mt-6 w-full"
        variant="secondary"
        onClick={async () => {
          await api("/api/auth/logout", {});
          router.replace("/");
        }}
      >
        Se déconnecter
      </Button>
    </div>
  );
}

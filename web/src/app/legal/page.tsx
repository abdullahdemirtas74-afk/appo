import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell } from "@/components/legal-shell";
import { LEGAL, LEGAL_LINKS, legalAddress } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Informations légales — AppO",
  description: "CGU, confidentialité, remboursements et mentions légales AppO.",
};

export default function LegalIndexPage() {
  return (
    <LegalShell
      title="Informations légales"
      subtitle="Tous les documents de protection AppO — clients, pros et stores"
      updated={LEGAL.updated}
    >
      <p className="text-muted">
        {LEGAL.legalName} — {legalAddress()}. Support :{" "}
        <a className="font-semibold text-appo" href={`mailto:${LEGAL.supportEmail}`}>
          {LEGAL.supportEmail}
        </a>
      </p>
      <ul className="mt-4 space-y-3">
        {LEGAL_LINKS.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="flex items-center justify-between rounded-2xl border border-line bg-card px-4 py-3 text-sm font-bold text-ink hover:border-appo/40"
            >
              {l.label}
              <span className="text-appo">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </LegalShell>
  );
}

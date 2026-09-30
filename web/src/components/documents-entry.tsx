"use client";

import Link from "next/link";
import { Receipt } from "lucide-react";

/** Entrée visible vers devis & factures (sous les missions). */
export function DocumentsEntry({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="mt-4 flex items-center gap-3 rounded-2xl border border-ink bg-ink px-4 py-3.5 text-white shadow-sm transition hover:bg-appo"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/15">
        <Receipt size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-extrabold">Devis & factures</span>
        <span className="block text-xs text-white/70">Documents électroniques de vos interventions</span>
      </span>
      <span className="text-lg font-bold opacity-80">→</span>
    </Link>
  );
}

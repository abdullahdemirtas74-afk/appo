"use client";

import { LanguageSettings } from "@/components/language-settings";

export default function AdminReglagesPage() {
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-extrabold">Réglages</h1>
      <p className="mt-1 text-sm text-muted">Préférences du compte administrateur</p>
      <div className="mt-6 rounded-3xl border border-line bg-white p-5">
        <LanguageSettings />
      </div>
    </div>
  );
}

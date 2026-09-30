"use client";

import { useMemo, useState, useEffect } from "react";
import { Button, Field, inputClass } from "@/components/ui";
import { useLocale } from "@/lib/i18n";
import { api } from "@/lib/hooks";
import { languageLabel } from "@/lib/languages";

export function LanguageSettings({ onSaved }: { onSaved?: () => void }) {
  const { locale, setLocale, t, languages } = useLocale();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(locale);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSelected(locale);
  }, [locale]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return languages;
    return languages.filter(
      (l) =>
        l.code.toLowerCase().includes(q) ||
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q),
    );
  }, [languages, query]);

  const current = languageLabel(selected, locale.startsWith("fr") ? "fr" : "en");

  async function save() {
    setBusy(true);
    setMsg("");
    try {
      await api("/api/me", { action: "setLocale", locale: selected });
      setLocale(selected);
      setMsg(t("saved"));
      onSaved?.();
    } catch {
      setMsg("Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-extrabold">{t("languageSettings")}</h2>
        <p className="mt-1 text-sm text-muted">{t("languageHint")}</p>
        <p className="mt-2 text-sm">
          {t("currentLanguage")} : <b>{current.nativeName}</b>
          {current.nativeName !== current.name ? ` (${current.name})` : ""} · {selected}
        </p>
      </div>
      <Field label={t("searchLanguage")}>
        <input
          className={inputClass}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="français, english, العربية, 中文…"
        />
      </Field>
      <div className="max-h-72 overflow-y-auto rounded-2xl border border-line">
        {filtered.map((l) => {
          const on = l.code === selected;
          return (
            <button
              key={l.code}
              type="button"
              className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm ${
                on ? "bg-ink text-white" : "hover:bg-background"
              }`}
              onClick={() => setSelected(l.code)}
            >
              <span>
                <span className="font-semibold">{l.nativeName}</span>
                {l.nativeName !== l.name ? (
                  <span className={`ml-2 ${on ? "opacity-70" : "text-muted"}`}>{l.name}</span>
                ) : null}
              </span>
              <span className={`text-xs uppercase ${on ? "opacity-70" : "text-muted"}`}>{l.code}</span>
            </button>
          );
        })}
        {filtered.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted">—</p>
        ) : null}
      </div>
      <Button className="w-full" variant="now" disabled={busy} onClick={save}>
        {t("saveLanguage")}
      </Button>
      {msg ? <p className="text-center text-sm text-muted">{msg}</p> : null}
    </div>
  );
}

import Link from "next/link";
import { LEGAL, LEGAL_LINKS } from "@/lib/legal";

/** Compact legal link row — use on landing, auth, account, shells. */
export function SiteLegalLinks({
  tone = "muted",
  className = "",
}: {
  tone?: "muted" | "light" | "ink";
  className?: string;
}) {
  const color =
    tone === "light"
      ? "text-white/45 hover:text-white/75"
      : tone === "ink"
        ? "text-ink/55 hover:text-ink"
        : "text-muted hover:text-ink";

  return (
    <nav
      aria-label="Informations légales"
      className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] font-semibold ${className}`}
    >
      {LEGAL_LINKS.map((l, i) => (
        <span key={l.href} className="inline-flex items-center gap-3">
          {i > 0 ? <span className={`opacity-40 ${color}`}>·</span> : null}
          <Link href={l.href} className={`underline-offset-2 hover:underline ${color}`}>
            {l.label}
          </Link>
        </span>
      ))}
    </nav>
  );
}

export function SiteLegalFooter({
  tone = "muted",
  className = "",
}: {
  tone?: "muted" | "light" | "ink";
  className?: string;
}) {
  const sub = tone === "light" ? "text-white/35" : "text-muted";
  return (
    <div className={`space-y-2 ${className}`}>
      <SiteLegalLinks tone={tone} />
      <p className={`text-center text-[10px] ${sub}`}>
        {LEGAL.legalName} · {LEGAL.city} · {LEGAL.supportEmail}
      </p>
    </div>
  );
}

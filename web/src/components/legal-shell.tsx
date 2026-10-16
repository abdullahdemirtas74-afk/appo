import Link from "next/link";
import { Logo } from "@/components/logo";

const LINKS = [
  { href: "/confidentialite", label: "Confidentialité" },
  { href: "/cgu", label: "CGU" },
  { href: "/remboursement", label: "Remboursements" },
  { href: "/mentions-legales", label: "Mentions légales" },
] as const;

export function LegalShell({
  title,
  subtitle,
  updated,
  children,
}: {
  title: string;
  subtitle: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background text-ink">
      <header className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-5">
        <Logo />
        <Link href="/" className="shrink-0 text-sm font-semibold text-appo">
          Accueil
        </Link>
      </header>
      <nav className="mx-auto flex max-w-3xl gap-2 overflow-x-auto px-5 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="shrink-0 rounded-full border border-line bg-card px-3 py-1.5 text-xs font-semibold text-muted hover:text-ink"
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <main className="mx-auto max-w-3xl px-5 pb-16 pt-4">
        <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted">{subtitle}</p>
        <p className="mt-1 text-xs text-muted">Dernière mise à jour : {updated}</p>
        <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-ink/90">{children}</div>
      </main>
      <footer className="border-t border-line px-5 py-8 text-center text-xs text-muted">
        <div className="mx-auto flex max-w-3xl flex-wrap justify-center gap-x-4 gap-y-2">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="font-semibold hover:text-ink">
              {l.label}
            </Link>
          ))}
        </div>
        <p className="mt-3">AppO — Le bon pro, sans attendre</p>
      </footer>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="mt-2 space-y-2 text-muted">{children}</div>
    </section>
  );
}

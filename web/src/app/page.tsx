import { Logo } from "@/components/logo";
import { Button } from "@/components/ui";
import { DEMO_ACCOUNTS } from "@/lib/demo";
import { ArrowRight, BadgeCheck, Clock, MapPin, Shield } from "lucide-react";

const cats = [
  ["🔧", "Plomberie"],
  ["💡", "Électricité"],
  ["🔑", "Serrurerie"],
  ["🌡️", "Chauffage"],
  ["🎨", "Peinture"],
  ["🌿", "Jardinage"],
];

export default function Landing() {
  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#0d0f14] text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5">
        <Logo light />
        <div className="flex shrink-0 gap-2 sm:gap-3">
          <Button href="/login" variant="secondary" className="px-3 py-2.5 text-sm sm:px-5 sm:py-3.5 sm:text-[15px]">
            Connexion
          </Button>
          <Button href="/register" variant="now" className="hidden px-3 py-2.5 text-sm sm:inline-flex sm:px-5 sm:py-3.5 sm:text-[15px]">
            Créer un compte
          </Button>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-10 sm:gap-12 sm:px-6 sm:py-14 lg:grid-cols-2 lg:py-16">
        <div className="min-w-0">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-appo sm:text-sm">
            Le Uber des services
          </p>
          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
            Votre projet.
            <br />
            <span className="text-appo">Le bon pro.</span>
          </h1>
          <p className="mt-5 max-w-md text-base text-white/70 sm:mt-6 sm:text-lg">
            Un plombier, un électricien, un serrurier — autour de vous, maintenant. AppO gère la
            mission, le suivi et le paiement.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
            <Button href="/login" variant="now" className="w-full px-7 sm:w-auto">
              J’ai besoin d’un pro <ArrowRight size={18} />
            </Button>
            <Button href="/register?role=pro" variant="secondary" className="w-full sm:w-auto">
              Je suis professionnel
            </Button>
          </div>
          <div className="mt-8 flex flex-col gap-3 text-sm text-white/60 sm:mt-10 sm:flex-row sm:flex-wrap sm:gap-8">
            <span className="flex items-center gap-2">
              <BadgeCheck size={16} className="shrink-0 text-appo" /> Pros vérifiés
            </span>
            <span className="flex items-center gap-2">
              <Shield size={16} className="shrink-0 text-appo" /> Paiement sécurisé
            </span>
            <span className="flex items-center gap-2">
              <Clock size={16} className="shrink-0 text-appo" /> AppO Now
            </span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="rounded-[28px] border border-white/10 bg-white p-4 text-ink shadow-2xl sm:rounded-[36px] sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <Logo size="sm" />
              <span className="flex items-center gap-1 text-sm text-muted">
                <MapPin size={14} /> Rumilly
              </span>
            </div>
            <div className="rounded-2xl bg-background px-4 py-3 text-sm text-muted">
              Quel service recherchez-vous ?
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {cats.map(([e, n]) => (
                <div key={n} className="rounded-2xl bg-background p-3 text-center text-xs font-semibold">
                  <div className="text-xl">{e}</div>
                  {n}
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-2xl bg-appo p-4 text-white">
              <div className="text-xs uppercase tracking-wider opacity-80">Nouvelle mission</div>
              <div className="mt-1 font-bold">Kevin arrive dans 12 min</div>
              <div className="text-sm opacity-90">Plomberie · Fuite sous évier</div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-white text-ink">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 sm:py-16 lg:grid-cols-4">
          {[
            ["1", "Dites votre besoin", "Choisissez un service, maintenant ou plus tard."],
            ["2", "Un pro accepte", "AppO trouve un professionnel vérifié autour de vous."],
            ["3", "Suivez-le en direct", "Carte, ETA, messages, appel."],
            ["4", "Payez dans l’app", "Commission transparente. Avis après mission."],
          ].map(([n, t, d]) => (
            <div key={n}>
              <div className="text-sm font-bold text-appo">0{n}</div>
              <h3 className="mt-2 font-bold">{t}</h3>
              <p className="mt-1 text-sm text-muted">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 px-4 py-10 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-6xl rounded-3xl bg-white/5 p-4 sm:p-6">
          <h2 className="font-bold">Comptes de démo — V1 locale</h2>
          <p className="mt-1 text-sm text-white/60">
            Mot de passe : appo123 — ouvrez deux onglets pour tester AppO Now.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {DEMO_ACCOUNTS.map((a) => (
              <div key={a.email} className="rounded-2xl bg-black/30 p-4 text-sm">
                <div className="text-xs font-bold text-appo">{a.role}</div>
                <div className="font-semibold">{a.name}</div>
                <div className="break-all text-white/60">{a.email}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="mx-auto mt-8 max-w-6xl pb-8 text-center text-xs text-white/40">
          AppO V1 locale · paiements simulés · pas de cartes bancaires stockées
        </p>
      </section>
    </div>
  );
}

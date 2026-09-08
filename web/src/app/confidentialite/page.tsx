import Link from "next/link";
import { Logo } from "@/components/logo";

export default function ConfidentialitePage() {
  return (
    <div className="min-h-dvh bg-background text-ink">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5">
        <Logo />
        <Link href="/" className="text-sm font-semibold text-appo">
          Accueil
        </Link>
      </header>
      <main className="mx-auto max-w-3xl px-5 pb-16">
        <h1 className="text-3xl font-extrabold tracking-tight">Politique de confidentialité</h1>
        <p className="mt-2 text-sm text-muted">AppO — protection des données personnelles (RGPD)</p>

        <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-ink/90">
          <section>
            <h2 className="text-lg font-bold">Responsable du traitement</h2>
            <p className="mt-2 text-muted">
              AppO traite vos données pour mettre en relation clients et professionnels, organiser les missions
              et sécuriser les paiements simulés de la plateforme.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold">Données collectées</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
              <li>Identité et contact : prénom, nom, e-mail, téléphone</li>
              <li>Adresses d’intervention</li>
              <li>Historique des missions, messages et factures</li>
              <li>Pour les pros : entreprise, SIRET, documents de vérification</li>
            </ul>
            <p className="mt-2 text-muted">AppO ne stocke jamais de numéro de carte bancaire.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold">Mesures de sécurité</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
              <li>Chiffrement des téléphones et adresses au repos (AES-256-GCM)</li>
              <li>Masquage des données personnelles côté administration par défaut</li>
              <li>Contacts (téléphone / adresse exacte) visibles seulement après acceptation d’une mission</li>
              <li>Sessions protégées par cookies sécurisés et secret applicatif</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold">Vos droits</h2>
            <p className="mt-2 text-muted">
              Vous pouvez exporter vos données ou demander la suppression / anonymisation de votre compte depuis{" "}
              <Link href="/app/compte" className="font-semibold text-appo">
                Mon compte
              </Link>
              . Vous pouvez aussi contacter aide@appo.fr.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold">Conservation</h2>
            <p className="mt-2 text-muted">
              Les données sont conservées le temps nécessaire au service. Après suppression du compte, les
              informations nominatives sont anonymisées ; certaines traces techniques de missions peuvent rester
              pour la comptabilité et la lutte contre la fraude.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { LegalSection, LegalShell } from "@/components/legal-shell";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Conditions générales d’utilisation — AppO",
  description: "CGU de la plateforme AppO : comptes, missions, paiements, responsabilités.",
};

export default function CguPage() {
  return (
    <LegalShell
      title="Conditions générales d’utilisation"
      subtitle="Règles applicables aux clients et professionnels AppO"
      updated={LEGAL.updated}
    >
      <LegalSection title="1. Objet">
        <p>
          Les présentes CGU régissent l’accès à la plateforme {LEGAL.brand} éditée par {LEGAL.legalName}. AppO
          met en relation des clients et des professionnels pour des prestations de services. AppO n’exécute
          pas la prestation : le contrat de service se forme entre le client et le professionnel, dans le cadre
          des règles de la plateforme.
        </p>
      </LegalSection>

      <LegalSection title="2. Acceptation">
        <p>
          L’inscription ou l’utilisation d’AppO vaut acceptation des présentes CGU, de la{" "}
          <Link href="/confidentialite" className="font-semibold text-appo">
            politique de confidentialité
          </Link>{" "}
          et de la{" "}
          <Link href="/remboursement" className="font-semibold text-appo">
            politique d’annulation & remboursements
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="3. Comptes">
        <ul className="list-disc space-y-1 pl-5">
          <li>Informations exactes et à jour obligatoires</li>
          <li>Compte personnel ; responsabilité des identifiants</li>
          <li>Pros : vérification documentaire (SIRET, identité, RC Pro le cas échéant) avant intervention</li>
          <li>Suspension possible en cas de fraude, abus ou non-respect des CGU</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Missions">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>AppO Now</strong> : matching immédiat
          </li>
          <li>
            <strong>RFQ / devis</strong> : comparaison d’offres puis choix client
          </li>
          <li>Suivi : acceptée → en route → arrivé → intervention → terminée → paiement / avis</li>
          <li>Contacts masqués jusqu’à acceptation de la mission</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Prix et paiements">
        <p>
          Les montants affichés couvrent la prestation et, le cas échéant, la commission plateforme. Les fonds
          peuvent être séquestrés par AppO jusqu’à la fin de mission. Détail des annulations :{" "}
          <Link href="/remboursement" className="font-semibold text-appo">
            remboursements
          </Link>
          .
        </p>
        <p>
          Les paiements de mission sont traités par Stripe. Les fonds peuvent être séquestrés par AppO puis
          versés au professionnel selon le délai de payout choisi (Stripe Connect).
        </p>
      </LegalSection>

      <LegalSection title="6. Abonnements">
        <p>
          Offres optionnelles (AppO+, Pro Prime / Elite, Boost) : avantages décrits dans l’app. Résiliation et
          renouvellement selon les modalités affichées à la souscription.
        </p>
      </LegalSection>

      <LegalSection title="7. Comportements interdits">
        <ul className="list-disc space-y-1 pl-5">
          <li>Contourner AppO pour payer une mission initiée sur la plateforme</li>
          <li>Contenus illicites, trompeurs ou harcèlement</li>
          <li>Usurpation d’identité ou documents falsifiés</li>
          <li>Abus du matching, des offres Now ou du support</li>
        </ul>
      </LegalSection>

      <LegalSection title="8. Responsabilité">
        <p>
          Le professionnel est responsable de la qualité de son intervention. AppO fournit des outils de
          vérification, de suivi et de médiation (support, litiges, garantie optionnelle) sans se substituer
          aux obligations du pro.
        </p>
      </LegalSection>

      <LegalSection title="9. Données personnelles">
        <p>
          Voir la{" "}
          <Link href="/confidentialite" className="font-semibold text-appo">
            politique de confidentialité
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="10. Droit applicable">
        <p>
          Droit français. Solution amiable via le support avant action judiciaire. Contact :{" "}
          <a className="font-semibold text-appo" href={`mailto:${LEGAL.supportEmail}`}>
            {LEGAL.supportEmail}
          </a>
        </p>
      </LegalSection>
    </LegalShell>
  );
}

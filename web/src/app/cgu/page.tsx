import type { Metadata } from "next";
import Link from "next/link";
import { LegalSection, LegalShell } from "@/components/legal-shell";

export const metadata: Metadata = {
  title: "Conditions générales d’utilisation — AppO",
  description: "CGU de la plateforme AppO : comptes, missions, paiements, responsabilités.",
};

export default function CguPage() {
  return (
    <LegalShell
      title="Conditions générales d’utilisation"
      subtitle="Règles d’usage de la plateforme AppO (clients et professionnels)"
      updated="16 octobre 2026"
    >
      <LegalSection title="1. Objet">
        <p>
          AppO est une plateforme de mise en relation entre clients (particuliers, entreprises, syndicats) et
          professionnels pour des prestations de services à domicile ou sur site. AppO n’est pas l’exécutant de
          la prestation : le contrat de service se forme entre le client et le professionnel, sous réserve des
          règles de la plateforme.
        </p>
      </LegalSection>

      <LegalSection title="2. Accès et comptes">
        <ul className="list-disc space-y-1 pl-5">
          <li>Vous devez fournir des informations exactes et à jour</li>
          <li>Un compte est personnel ; vous êtes responsable de vos identifiants</li>
          <li>Les professionnels doivent être vérifiés (documents, SIRET) avant d’intervenir</li>
          <li>AppO peut suspendre un compte en cas de fraude, abus ou non-respect des présentes CGU</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Fonctionnement des missions">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>AppO Now</strong> : offre immédiate à un pro disponible
          </li>
          <li>
            <strong>RFQ / devis</strong> : le client compare des offres puis choisit
          </li>
          <li>Une fois acceptée, la mission suit un parcours (en route, arrivé, intervention, terminée)</li>
          <li>Les contacts (téléphone, adresse exacte) restent masqués jusqu’à l’acceptation</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Prix, commission et paiements">
        <p>
          Les prix affichés incluent le service et, le cas échéant, la commission plateforme. Les paiements
          transitent via AppO (séquestre / escrow) pour sécuriser client et pro. Les modalités de remboursement
          sont décrites dans la page{" "}
          <Link href="/remboursement" className="font-semibold text-appo">
            Annulations & remboursements
          </Link>
          .
        </p>
        <p>
          Tant que les paiements réelle (Stripe) ne sont pas activés en production, certaines transactions
          peuvent être simulées à des fins de démonstration.
        </p>
      </LegalSection>

      <LegalSection title="5. Abonnements (AppO+, Pro Prime / Elite)">
        <p>
          Des offres d’abonnement optionnelles peuvent donner accès à des avantages (négociation, boost,
          statistiques). Elles sont distinctes du paiement d’une mission. Les conditions de renouvellement et
          d’annulation sont indiquées au moment de la souscription dans l’app.
        </p>
      </LegalSection>

      <LegalSection title="6. Contenu et comportement">
        <p>Il est interdit de :</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Contourner la plateforme pour les paiements liés à une mission initiée sur AppO</li>
          <li>Publier des contenus illicites, diffamatoires ou trompeurs</li>
          <li>Usurper une identité ou falsifier des documents</li>
          <li>Harceler un utilisateur ou abuser du matching / des offres Now</li>
        </ul>
      </LegalSection>

      <LegalSection title="7. Responsabilité">
        <p>
          Le professionnel est responsable de la qualité et de la conformité de son intervention. AppO met en
          œuvre des moyens de vérification et de médiation (support, litiges, garantie optionnelle) mais ne
          garantit pas le résultat de chaque prestation au-delà des engagements décrits dans l’app.
        </p>
      </LegalSection>

      <LegalSection title="8. Propriété intellectuelle">
        <p>
          Les marques, logos et éléments de l’interface AppO sont protégés. Vous conservez vos contenus
          (photos, textes) et accordez à AppO une licence d’utilisation nécessaire au service.
        </p>
      </LegalSection>

      <LegalSection title="9. Données personnelles">
        <p>
          Le traitement des données est décrit dans la{" "}
          <Link href="/confidentialite" className="font-semibold text-appo">
            politique de confidentialité
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="10. Droit applicable">
        <p>
          Les présentes CGU sont régies par le droit français. En cas de litige, une solution amiable sera
          recherchée via le support AppO avant toute action judiciaire.
        </p>
        <p>
          Contact :{" "}
          <a className="font-semibold text-appo" href="mailto:aide@appo.fr">
            aide@appo.fr
          </a>
        </p>
      </LegalSection>
    </LegalShell>
  );
}

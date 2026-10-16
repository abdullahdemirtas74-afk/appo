import type { Metadata } from "next";
import Link from "next/link";
import { LegalSection, LegalShell } from "@/components/legal-shell";

export const metadata: Metadata = {
  title: "Politique de confidentialité — AppO",
  description: "Comment AppO collecte, utilise et protège vos données personnelles (RGPD).",
};

export default function ConfidentialitePage() {
  return (
    <LegalShell
      title="Politique de confidentialité"
      subtitle="AppO — protection des données personnelles (RGPD)"
      updated="16 octobre 2026"
    >
      <LegalSection title="1. Responsable du traitement">
        <p>
          Le responsable du traitement est l’éditeur de la plateforme AppO (ci-après « AppO »). Pour toute
          question relative à vos données :{" "}
          <a className="font-semibold text-appo" href="mailto:aide@appo.fr">
            aide@appo.fr
          </a>
          . Les coordonnées légales complètes figurent dans les{" "}
          <Link href="/mentions-legales" className="font-semibold text-appo">
            mentions légales
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="2. Données collectées">
        <ul className="list-disc space-y-1 pl-5">
          <li>Identité et contact : prénom, nom, e-mail, téléphone</li>
          <li>Adresses d’intervention et, le cas échéant, position approximative (géolocalisation)</li>
          <li>Photos et documents que vous importez (besoin, pièces, justificatifs pro)</li>
          <li>Historique des missions, messages, devis, factures et litiges</li>
          <li>Pour les professionnels : entreprise, SIRET, documents de vérification (KYC)</li>
          <li>Données techniques : logs, type d’appareil, identifiants de session</li>
        </ul>
        <p>AppO ne stocke jamais de numéro de carte bancaire en clair sur ses serveurs.</p>
      </LegalSection>

      <LegalSection title="3. Finalités et bases légales">
        <ul className="list-disc space-y-1 pl-5">
          <li>Fourniture du service de mise en relation et suivi de mission (exécution du contrat)</li>
          <li>Paiements, facturation et lutte contre la fraude (intérêt légitime / obligations légales)</li>
          <li>Support client, litiges et garantie (exécution du contrat)</li>
          <li>Amélioration du service et sécurité (intérêt légitime)</li>
          <li>Notifications (e-mail, SMS ou push) liées au service, avec consentement lorsque requis</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Partage des données">
        <p>Vos données peuvent être partagées uniquement avec :</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Le professionnel ou le client concerné par une mission (après acceptation / déblocage des contacts)</li>
          <li>Prestataires techniques (hébergement, stockage fichiers, e-mail, paiements) sous contrat</li>
          <li>Autorités compétentes si la loi l’exige</li>
        </ul>
        <p>AppO ne vend pas vos données personnelles.</p>
      </LegalSection>

      <LegalSection title="5. Mesures de sécurité">
        <ul className="list-disc space-y-1 pl-5">
          <li>Chiffrement des téléphones et adresses au repos</li>
          <li>Masquage des données personnelles côté administration par défaut</li>
          <li>Contacts (téléphone / adresse exacte) visibles seulement après acceptation d’une mission</li>
          <li>Sessions protégées par cookies sécurisés</li>
          <li>Accès restreints et journaux d’activité côté admin</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Cookies et application mobile">
        <p>
          AppO utilise des cookies / stockage local essentiels à la connexion et au fonctionnement du service.
          Dans l’application mobile (Capacitor), les mêmes règles s’appliquent : la WebView charge le service
          AppO et peut demander caméra, photos, localisation ou notifications selon votre usage.
        </p>
      </LegalSection>

      <LegalSection title="7. Conservation">
        <p>
          Les données sont conservées le temps nécessaire au service. Après suppression du compte, les
          informations nominatives sont anonymisées ; certaines traces (facturation, fraude, litiges) peuvent
          être conservées pour obligations légales.
        </p>
      </LegalSection>

      <LegalSection title="8. Vos droits (RGPD)">
        <p>
          Vous disposez d’un droit d’accès, de rectification, d’effacement, de limitation, d’opposition et de
          portabilité. Depuis{" "}
          <Link href="/app/compte" className="font-semibold text-appo">
            Mon compte
          </Link>{" "}
          vous pouvez exporter vos données ou demander la suppression. Vous pouvez aussi écrire à aide@appo.fr
          ou saisir la CNIL si nécessaire.
        </p>
      </LegalSection>

      <LegalSection title="9. Documents associés">
        <p>
          <Link href="/cgu" className="font-semibold text-appo">
            Conditions générales d’utilisation
          </Link>
          {" · "}
          <Link href="/remboursement" className="font-semibold text-appo">
            Annulations & remboursements
          </Link>
          {" · "}
          <Link href="/mentions-legales" className="font-semibold text-appo">
            Mentions légales
          </Link>
        </p>
      </LegalSection>
    </LegalShell>
  );
}

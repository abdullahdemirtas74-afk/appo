import type { Metadata } from "next";
import Link from "next/link";
import { LegalSection, LegalShell } from "@/components/legal-shell";
import { LEGAL, legalAddress } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Politique de confidentialité — AppO",
  description: "Comment AppO collecte, utilise et protège vos données personnelles (RGPD).",
};

export default function ConfidentialitePage() {
  return (
    <LegalShell
      title="Politique de confidentialité"
      subtitle="Protection des données personnelles — RGPD"
      updated={LEGAL.updated}
    >
      <LegalSection title="1. Responsable du traitement">
        <p>
          Le responsable du traitement est <strong>{LEGAL.legalName}</strong> ({LEGAL.brand}), {legalAddress()}.
          Contact données personnelles :{" "}
          <a className="font-semibold text-appo" href={`mailto:${LEGAL.supportEmail}`}>
            {LEGAL.supportEmail}
          </a>
          . Mentions complètes :{" "}
          <Link href="/mentions-legales" className="font-semibold text-appo">
            mentions légales
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="2. Données collectées">
        <ul className="list-disc space-y-1 pl-5">
          <li>Identité et contact : prénom, nom, e-mail, téléphone</li>
          <li>Adresses d’intervention et géolocalisation (si autorisée) pour le matching et le suivi</li>
          <li>Photos et documents importés (besoin, justificatifs, KYC pro)</li>
          <li>Missions, messages, devis, factures, litiges, wallet / avoirs</li>
          <li>Pros : entreprise, SIRET, documents de vérification, disponibilités</li>
          <li>Données techniques : logs, appareil, cookies de session</li>
        </ul>
        <p>AppO ne stocke jamais de numéro de carte bancaire en clair sur ses serveurs.</p>
      </LegalSection>

      <LegalSection title="3. Finalités et bases légales">
        <ul className="list-disc space-y-1 pl-5">
          <li>Mise en relation, missions, devis, facturation (contrat)</li>
          <li>Paiements sécurisés, antifraude, obligations comptables (contrat / obligation légale)</li>
          <li>Support, litiges, garantie optionnelle (contrat)</li>
          <li>Sécurité et amélioration du service (intérêt légitime)</li>
          <li>Notifications service (e-mail / SMS / push) — consentement lorsque requis</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Destinataires">
        <ul className="list-disc space-y-1 pl-5">
          <li>Client ou pro de la mission (contacts débloqués après acceptation)</li>
          <li>Prestataires techniques (hébergement, stockage, e-mail, paiement) sous contrat</li>
          <li>Autorités si la loi l’exige</li>
        </ul>
        <p>
          <strong>AppO ne vend pas vos données personnelles.</strong>
        </p>
      </LegalSection>

      <LegalSection title="5. Transferts et sécurité">
        <ul className="list-disc space-y-1 pl-5">
          <li>Chiffrement des téléphones et adresses au repos</li>
          <li>Masquage PII côté admin par défaut</li>
          <li>Cookies de session sécurisés (SameSite, Secure en production)</li>
          <li>Hébergement cloud ({LEGAL.host}) avec accès restreints</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Cookies et application mobile">
        <p>
          Cookies / stockage local essentiels à l’authentification et au service. Dans l’app native (
          {LEGAL.appId}), la WebView charge AppO et peut demander caméra, photothèque, localisation ou
          notifications selon les fonctionnalités utilisées.
        </p>
      </LegalSection>

      <LegalSection title="7. Durées de conservation">
        <p>
          Conservation pendant la durée du compte et des obligations légales. Après suppression : anonymisation
          des données nominatives ; conservation possible de traces de facturation / fraude / litiges.
        </p>
      </LegalSection>

      <LegalSection title="8. Vos droits">
        <p>
          Accès, rectification, effacement, limitation, opposition, portabilité. Depuis{" "}
          <Link href="/app/compte" className="font-semibold text-appo">
            Mon compte
          </Link>{" "}
          : export JSON et suppression. Réclamation possible auprès de la CNIL. Contact : {LEGAL.supportEmail}.
        </p>
      </LegalSection>

      <LegalSection title="9. Documents liés">
        <p>
          <Link href="/cgu" className="font-semibold text-appo">
            CGU
          </Link>
          {" · "}
          <Link href="/remboursement" className="font-semibold text-appo">
            Remboursements
          </Link>
          {" · "}
          <Link href="/mentions-legales" className="font-semibold text-appo">
            Mentions légales
          </Link>
          {" · "}
          <Link href="/legal" className="font-semibold text-appo">
            Hub légal
          </Link>
        </p>
      </LegalSection>
    </LegalShell>
  );
}

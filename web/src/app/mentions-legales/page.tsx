import type { Metadata } from "next";
import Link from "next/link";
import { LegalSection, LegalShell } from "@/components/legal-shell";
import { LEGAL, legalAddress } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Mentions légales — AppO",
  description: "Mentions légales de la plateforme AppO.",
};

export default function MentionsLegalesPage() {
  return (
    <LegalShell
      title="Mentions légales"
      subtitle="Éditeur, hébergement et propriété intellectuelle"
      updated={LEGAL.updated}
    >
      <LegalSection title="1. Éditeur du site et des applications">
        <p>
          <strong>Nom commercial :</strong> {LEGAL.brand}
          <br />
          <strong>Raison sociale :</strong> {LEGAL.legalName}
          <br />
          <strong>Forme juridique :</strong> {LEGAL.legalForm}
          <br />
          <strong>Capital :</strong> {LEGAL.capital}
          <br />
          <strong>SIRET :</strong> {LEGAL.siret}
          <br />
          <strong>Siège :</strong> {legalAddress()} ({LEGAL.region})
          <br />
          <strong>E-mail :</strong>{" "}
          <a className="font-semibold text-appo" href={`mailto:${LEGAL.supportEmail}`}>
            {LEGAL.supportEmail}
          </a>
          {" · "}
          <a className="font-semibold text-appo" href={`mailto:${LEGAL.contactEmail}`}>
            {LEGAL.contactEmail}
          </a>
        </p>
      </LegalSection>

      <LegalSection title="2. Directeur de la publication">
        <p>
          Directeur de la publication : <strong>{LEGAL.publisher}</strong>, représentant de {LEGAL.legalName}.
        </p>
      </LegalSection>

      <LegalSection title="3. Hébergement">
        <p>
          Hébergement applicatif : {LEGAL.host}. Stockage de fichiers éventuel via service compatible S3.
          Traitement des données décrit dans la{" "}
          <Link href="/confidentialite" className="font-semibold text-appo">
            politique de confidentialité
          </Link>
          .
        </p>
        <p>
          Site :{" "}
          <a className="break-all font-semibold text-appo" href={LEGAL.publicUrl} target="_blank" rel="noreferrer">
            {LEGAL.publicUrl}
          </a>
        </p>
      </LegalSection>

      <LegalSection title="4. Applications mobiles">
        <p>
          Applications iOS et Android AppO (identifiant technique <code className="text-ink">{LEGAL.appId}</code>
          ). Elles présentent le service AppO ; les présentes mentions, les CGU, la politique de
          confidentialité et la politique de remboursement s’y appliquent.
        </p>
      </LegalSection>

      <LegalSection title="5. Propriété intellectuelle">
        <p>
          Marques, logos, textes, interfaces et éléments graphiques d’AppO sont protégés. Toute reproduction
          non autorisée est interdite. Les contenus utilisateurs restent la propriété de leurs auteurs, avec
          licence d’usage nécessaire au fonctionnement du service.
        </p>
      </LegalSection>

      <LegalSection title="6. Médiation & contact">
        <p>
          Pour toute réclamation :{" "}
          <a className="font-semibold text-appo" href={`mailto:${LEGAL.supportEmail}`}>
            {LEGAL.supportEmail}
          </a>
          . Voir aussi{" "}
          <Link href="/remboursement" className="font-semibold text-appo">
            annulations & remboursements
          </Link>{" "}
          et les{" "}
          <Link href="/cgu" className="font-semibold text-appo">
            CGU
          </Link>
          .
        </p>
      </LegalSection>
    </LegalShell>
  );
}

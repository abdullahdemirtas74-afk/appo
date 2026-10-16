import type { Metadata } from "next";
import Link from "next/link";
import { LegalSection, LegalShell } from "@/components/legal-shell";

export const metadata: Metadata = {
  title: "Mentions légales — AppO",
  description: "Mentions légales de la plateforme AppO.",
};

export default function MentionsLegalesPage() {
  return (
    <LegalShell
      title="Mentions légales"
      subtitle="Informations légales sur l’éditeur et l’hébergement d’AppO"
      updated="16 octobre 2026"
    >
      <LegalSection title="1. Éditeur">
        <p>
          <strong>Nom commercial :</strong> AppO
          <br />
          <strong>Slogan :</strong> Le bon pro, sans attendre
          <br />
          <strong>Contact :</strong>{" "}
          <a className="font-semibold text-appo" href="mailto:aide@appo.fr">
            aide@appo.fr
          </a>
        </p>
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          À compléter avant publication stores / prod : raison sociale ou nom de l’auto-entrepreneur, forme
          juridique, SIRET, adresse du siège, responsable de publication.
        </p>
      </LegalSection>

      <LegalSection title="2. Directeur de la publication">
        <p>Le directeur de la publication est le représentant légal de l’éditeur AppO.</p>
      </LegalSection>

      <LegalSection title="3. Hébergement">
        <p>
          Application web hébergée via Railway (infrastructure cloud). Stockage fichiers éventuel via service
          S3-compatible. Les données sont traitées dans le cadre décrit par la{" "}
          <Link href="/confidentialite" className="font-semibold text-appo">
            politique de confidentialité
          </Link>
          .
        </p>
        <p>
          URL de production :{" "}
          <a
            className="font-semibold text-appo break-all"
            href="https://appo-production-10fb.up.railway.app"
            target="_blank"
            rel="noreferrer"
          >
            https://appo-production-10fb.up.railway.app
          </a>
        </p>
      </LegalSection>

      <LegalSection title="4. Applications mobiles">
        <p>
          Les applications iOS et Android AppO (identifiant <code className="text-ink">com.appo.app</code>)
          affichent le service web AppO dans une enveloppe native. Les mêmes mentions, CGU et politique de
          confidentialité s’appliquent.
        </p>
      </LegalSection>

      <LegalSection title="5. Propriété intellectuelle">
        <p>
          L’ensemble des éléments du site et des applications (textes, graphismes, logo, structure) est protégé.
          Toute reproduction non autorisée est interdite.
        </p>
      </LegalSection>

      <LegalSection title="6. Documents associés">
        <p>
          <Link href="/cgu" className="font-semibold text-appo">
            CGU
          </Link>
          {" · "}
          <Link href="/confidentialite" className="font-semibold text-appo">
            Confidentialité
          </Link>
          {" · "}
          <Link href="/remboursement" className="font-semibold text-appo">
            Remboursements
          </Link>
        </p>
      </LegalSection>
    </LegalShell>
  );
}

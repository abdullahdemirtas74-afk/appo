import type { Metadata } from "next";
import Link from "next/link";
import { LegalSection, LegalShell } from "@/components/legal-shell";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Annulations & remboursements — AppO",
  description: "Politique d’annulation, remboursements, litiges et garantie AppO.",
};

export default function RemboursementPage() {
  return (
    <LegalShell
      title="Annulations & remboursements"
      subtitle="Règles de protection pour les clients et les professionnels"
      updated={LEGAL.updated}
    >
      <LegalSection title="1. Principe">
        <p>
          Les fonds d’une mission sont en principe séquestrés par {LEGAL.brand} jusqu’à la fin de
          l’intervention, puis versés au professionnel selon le calendrier de payout. Un remboursement client
          est possible tant que les fonds sont encore séquestrés, ou après décision de médiation.
        </p>
      </LegalSection>

      <LegalSection title="2. Avant l’intervention">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Sans pro assigné / avant acceptation</strong> : annulation libre, pas de prélèvement
            définitif
          </li>
          <li>
            <strong>Après acceptation, avant « En route »</strong> : remboursement des fonds séquestrés (sauf
            abus répétés)
          </li>
          <li>
            <strong>Annulation par le pro</strong> : remboursement client ; sanctions possibles (score,
            suspension)
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Pendant / après l’intervention">
        <ul className="list-disc space-y-1 pl-5">
          <li>Mission non réalisée (no-show, impossibilité) → remboursement client</li>
          <li>Mission terminée et payée → ouverture d’un litige via Aide & support</li>
          <li>Médiation : remboursement total, partiel ou avoir Wallet selon preuves</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Délais de remboursement">
        <p>
          Après décision : quelques jours ouvrés selon le moyen de paiement. Les crédits Wallet sont
          réutilisables immédiatement sur AppO.
        </p>
      </LegalSection>

      <LegalSection title="5. Droit de rétractation">
        <p>
          Pour une prestation à date convenue, le délai de rétractation de 14 jours peut ne plus s’appliquer
          une fois l’exécution commencée avec votre accord. Les abonnements numériques (AppO+, offres Pro)
          se résilient selon l’écran de souscription ; les périodes déjà consommées ne sont en principe pas
          remboursées.
        </p>
      </LegalSection>

      <LegalSection title="6. Garantie AppO">
        <p>
          Couverture optionnelle mission par mission. Claim depuis la mission ou{" "}
          <Link href="/app/garantie" className="font-semibold text-appo">
            Garantie
          </Link>
          . Claim validé → crédit Wallet.
        </p>
      </LegalSection>

      <LegalSection title="7. Demander un remboursement">
        <ol className="list-decimal space-y-1 pl-5">
          <li>Ouvrir la mission ou Aide & litiges</li>
          <li>Décrire le problème + preuves (photos, messages)</li>
          <li>Attendre la décision support / admin</li>
        </ol>
        <p>
          E-mail :{" "}
          <a className="font-semibold text-appo" href={`mailto:${LEGAL.supportEmail}`}>
            {LEGAL.supportEmail}
          </a>
        </p>
      </LegalSection>

      <LegalSection title="8. Documents liés">
        <p>
          <Link href="/cgu" className="font-semibold text-appo">
            CGU
          </Link>
          {" · "}
          <Link href="/confidentialite" className="font-semibold text-appo">
            Confidentialité
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

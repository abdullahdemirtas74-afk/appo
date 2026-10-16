import type { Metadata } from "next";
import Link from "next/link";
import { LegalSection, LegalShell } from "@/components/legal-shell";

export const metadata: Metadata = {
  title: "Annulations & remboursements — AppO",
  description: "Politique d’annulation, remboursements, litiges et garantie AppO.",
};

export default function RemboursementPage() {
  return (
    <LegalShell
      title="Annulations & remboursements"
      subtitle="Protection client et professionnel — règles de remboursement AppO"
      updated="16 octobre 2026"
    >
      <LegalSection title="1. Principe">
        <p>
          Les fonds d’une mission sont en principe conservés par AppO (séquestre) jusqu’à la fin de
          l’intervention, puis versés au professionnel selon le calendrier de payout. Un remboursement client
          est possible tant que les fonds n’ont pas été définitivement libérés, ou sur décision de médiation.
        </p>
      </LegalSection>

      <LegalSection title="2. Annulation avant intervention">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Avant acceptation / sans pro assigné</strong> : annulation libre, aucun prélèvement
            définitif
          </li>
          <li>
            <strong>Après acceptation, avant « En route »</strong> : remboursement intégral des fonds encore
            séquestrés, sauf abus répétés
          </li>
          <li>
            <strong>Pro qui annule</strong> : le client est remboursé ; AppO peut pénaliser le pro (score,
            suspension)
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Pendant ou après l’intervention">
        <ul className="list-disc space-y-1 pl-5">
          <li>Si la mission n’a pas pu être réalisée (no-show pro, impossibilité) : remboursement client</li>
          <li>
            Si la mission est terminée et payée : ouverture d’un <strong>litige</strong> via Aide & support
          </li>
          <li>
            La médiation AppO peut aboutir à un remboursement total, partiel, ou un avoir Wallet selon les
            éléments fournis (photos, messages, devis)
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Délais">
        <p>
          Un remboursement décidé apparaît en général sous quelques jours ouvrés selon le moyen de paiement
          (carte, crédits Wallet). Les crédits Wallet sont réutilisables immédiatement sur de nouvelles
          missions.
        </p>
      </LegalSection>

      <LegalSection title="5. Droit de rétractation">
        <p>
          Pour les prestations de services à domicile exécutées à une date convenue, le droit de rétractation
          de 14 jours peut ne pas s’appliquer une fois l’exécution commencée avec votre accord. Les
          abonnements numériques (ex. AppO+) peuvent être résiliés selon les modalités affichées à la
          souscription ; les périodes déjà consommées ne sont en principe pas remboursées.
        </p>
      </LegalSection>

      <LegalSection title="6. Garantie AppO (optionnelle)">
        <p>
          La Garantie AppO est une couverture optionnelle souscrite mission par mission. Les conditions
          d’éligibilité et de claim sont rappelées dans l’app (
          <Link href="/app/garantie" className="font-semibold text-appo">
            Garantie
          </Link>
          ). Un claim validé donne lieu à un crédit Wallet, pas nécessairement à un virement bancaire.
        </p>
      </LegalSection>

      <LegalSection title="7. Comment demander un remboursement">
        <ol className="list-decimal space-y-1 pl-5">
          <li>Ouvrez la mission concernée ou Aide & litiges</li>
          <li>Décrivez le problème et joignez des preuves si possible</li>
          <li>Attendez la décision support / admin AppO</li>
        </ol>
        <p>
          Contact :{" "}
          <a className="font-semibold text-appo" href="mailto:aide@appo.fr">
            aide@appo.fr
          </a>
        </p>
      </LegalSection>

      <LegalSection title="8. Documents associés">
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

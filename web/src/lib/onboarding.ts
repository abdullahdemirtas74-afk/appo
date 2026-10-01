export type OnboardingStep = {
  id: string;
  title: string;
  body: string;
  ctaLabel: string;
  href: string;
};

export const CLIENT_ONBOARDING: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Bienvenue sur AppO",
    body: "En quelques étapes, vous saurez comment trouver un pro vérifié près de chez vous — immédiatement ou sur rendez-vous.",
    ctaLabel: "Voir mon adresse",
    href: "/app/compte",
  },
  {
    id: "find",
    title: "Trouver un pro",
    body: "Utilisez « Maintenant » pour une urgence, la recherche pour comparer, ou publiez une demande pour recevoir plusieurs devis.",
    ctaLabel: "Ouvrir la recherche",
    href: "/app/recherche",
  },
  {
    id: "follow",
    title: "Suivre vos missions",
    body: "Une fois une mission lancée, suivez l’arrivée du pro, échangez dans Messages et validez la fin d’intervention.",
    ctaLabel: "Voir mes missions",
    href: "/app/missions",
  },
  {
    id: "docs",
    title: "Factures & crédits",
    body: "Retrouvez devis et factures électroniques sous Factures. Wallet et parrainage vous donnent des crédits pour les prochaines interventions.",
    ctaLabel: "Ouvrir Factures",
    href: "/app/factures",
  },
];

export const PRO_ONBOARDING: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Bienvenue AppO Pro",
    body: "Complétez votre profil pour apparaître auprès des clients de votre zone. On vous guide sur les points essentiels.",
    ctaLabel: "Mon profil",
    href: "/pro/profil",
  },
  {
    id: "docs",
    title: "Vérification documents",
    body: "Identité, Kbis et RC Pro : envoyez vos pièces pour obtenir le badge vérifié et accéder aux missions.",
    ctaLabel: "Envoyer mes docs",
    href: "/pro/verification",
  },
  {
    id: "planning",
    title: "Planning & dispo",
    body: "Définissez vos créneaux, absences et rayon d’intervention. Les clients ne voient que les pros réellement disponibles.",
    ctaLabel: "Ouvrir le planning",
    href: "/pro/planning",
  },
  {
    id: "offers",
    title: "Offres & revenus",
    body: "Les missions Now apparaissent en alerte. Acceptez, suivez le GPS client, puis consultez vos stats et versements.",
    ctaLabel: "Voir mes revenus",
    href: "/pro/revenus",
  },
];

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
    body: "Le bouton DISPONIBLE sur l’accueil active les missions Now. Complétez ensuite docs et planning.",
    ctaLabel: "Mon accueil",
    href: "/pro",
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
    body: "Définissez vos créneaux, absences et rayon. Les clients ne voient que les pros réellement disponibles.",
    ctaLabel: "Ouvrir le planning",
    href: "/pro/planning",
  },
  {
    id: "offers",
    title: "Demandes & missions",
    body: "Les alertes Now apparaissent en pop-up. Les devis clients sont dans Demandes. Suivez le reste dans Missions.",
    ctaLabel: "Voir les demandes",
    href: "/pro/demandes",
  },
];

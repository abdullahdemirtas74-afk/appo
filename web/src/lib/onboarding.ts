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
    body: "Indiquez votre adresse, puis demandez un pro en quelques étapes — immédiat, rendez-vous ou devis.",
    ctaLabel: "Voir mon adresse",
    href: "/app",
  },
  {
    id: "find",
    title: "Demander un pro",
    body: "Un seul bouton : choisissez le service, le moment (maintenant / rendez-vous / devis), et c’est parti.",
    ctaLabel: "Demander un pro",
    href: "/app/demander",
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
    title: "Factures & compte",
    body: "Factures, wallet et réglages sont regroupés dans Compte — moins d’onglets, plus clair.",
    ctaLabel: "Ouvrir Compte",
    href: "/app/compte",
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

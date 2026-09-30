export type AssistantReply = {
  messages: { role: "assistant" | "user"; text: string }[];
  categoryId: string | null;
  categoryName: string | null;
  estimatedPrice: number | null;
  urgency: boolean;
  ready: boolean;
  suggestedType: "now" | "scheduled" | "rfq";
  draftDescription: string;
};

const RULES: { keys: string[]; categoryId: string; categoryName: string; price: number; questions: string[] }[] = [
  {
    keys: ["évier", "evier", "fuite", "robinet", "wc", "chasse", "plomber", "canalisation", "chauffe"],
    categoryId: "cat_plomberie",
    categoryName: "Plomberie",
    price: 59,
    questions: ["La fuite est-elle active en ce moment ?", "Avez-vous coupé l’arrivée d’eau ?"],
  },
  {
    keys: ["électri", "electric", "prise", "disjonct", "courant", "lumière", "ampoule", "tableau"],
    categoryId: "cat_electricite",
    categoryName: "Électricité",
    price: 65,
    questions: ["Y a-t-il encore du courant dans le logement ?", "Le disjoncteur a-t-il sauté ?"],
  },
  {
    keys: ["serrur", "clé", "porte", "claquée", "crochetage"],
    categoryId: "cat_serrurerie",
    categoryName: "Serrurerie",
    price: 89,
    questions: ["Êtes-vous bloqué dehors ?", "Disposez-vous encore d’une clé ?"],
  },
  {
    keys: ["pneu", "voiture", "batterie", "mécan", "crevaison", "vidange"],
    categoryId: "cat_mecanique",
    categoryName: "Mécanique auto",
    price: 70,
    questions: ["Le véhicule est-il immobilisé ?", "Avez-vous la dimension / marque du pneu si besoin ?"],
  },
  {
    keys: ["ménage", "menage", "nettoyer", "repassage"],
    categoryId: "cat_menage",
    categoryName: "Ménage",
    price: 28,
    questions: ["S’agit-il d’un passage ponctuel ou récurrent ?", "Quelle surface approximative ?"],
  },
  {
    keys: ["jardin", "tonte", "haie", "pelouse"],
    categoryId: "cat_jardinage",
    categoryName: "Jardinage",
    price: 55,
    questions: ["Souhaitez-vous une intervention ponctuelle ou un abonnement ?", "Quelle taille de jardin ?"],
  },
];

export function runAssistant(input: {
  text: string;
  history?: { role: string; text: string }[];
}): AssistantReply {
  const text = String(input.text || "").trim();
  const lower = text.toLowerCase();
  const matched =
    RULES.find((r) => r.keys.some((k) => lower.includes(k))) ??
    RULES.find((r) => (input.history ?? []).some((h) => r.keys.some((k) => h.text.toLowerCase().includes(k))));

  const urgency = /urgent|maintenant|immédiat|tout de suite|sos|fuite active/.test(lower);
  const recurring = /chaque semaine|mensuel|abonnement|récurrent|recurrent/.test(lower);

  if (!matched) {
    return {
      messages: [
        {
          role: "assistant",
          text: "Je peux vous aider. Décrivez le problème (ex. « mon évier fuit », « pneu crevé », « plus de courant »).",
        },
      ],
      categoryId: null,
      categoryName: null,
      estimatedPrice: null,
      urgency: false,
      ready: false,
      suggestedType: "now",
      draftDescription: text,
    };
  }

  const answered = (input.history ?? []).filter((h) => h.role === "user").length >= 2 || text.length > 40;
  const estimate = urgency ? Math.round(matched.price * 1.25) : matched.price;
  const messages: AssistantReply["messages"] = [
    {
      role: "assistant",
      text: `Je détecte un besoin en ${matched.categoryName}. Estimation indicative : à partir de ${estimate} €.`,
    },
  ];
  if (!answered) {
    messages.push({
      role: "assistant",
      text: matched.questions[0],
    });
    return {
      messages,
      categoryId: matched.categoryId,
      categoryName: matched.categoryName,
      estimatedPrice: estimate,
      urgency,
      ready: false,
      suggestedType: urgency ? "now" : recurring ? "scheduled" : "now",
      draftDescription: text || `${matched.categoryName} — besoin détecté par l’assistant AppO`,
    };
  }

  messages.push({
    role: "assistant",
    text: urgency
      ? "Je peux lancer une urgence AppO Now pour trouver le pro le plus proche."
      : recurring
        ? "Je vous recommande une prestation récurrente, ou une demande avec devis."
        : "Je peux créer la mission maintenant, ou ouvrir une demande pour comparer des offres.",
  });

  return {
    messages,
    categoryId: matched.categoryId,
    categoryName: matched.categoryName,
    estimatedPrice: estimate,
    urgency,
    ready: true,
    suggestedType: urgency ? "now" : recurring ? "rfq" : "now",
    draftDescription:
      text ||
      `${matched.categoryName} — diagnostic assistant AppO${urgency ? " (urgence)" : ""}`,
  };
}

export function money(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function moneyExact(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

export function km(n: number) {
  return `${n.toFixed(1).replace(".", ",")} km`;
}

export function stars(n: number) {
  return n.toFixed(1).replace(".", ",");
}

export function displayName(first: string, last: string) {
  return `${first} ${last.charAt(0).toUpperCase()}.`;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const DAY_LABELS = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];

export const STATUS_LABELS: Record<string, string> = {
  searching: "Recherche en cours",
  offered: "En attente d’un professionnel",
  accepted: "Mission confirmée",
  en_route: "En route",
  arrived: "Arrivé",
  in_progress: "Intervention en cours",
  completed: "Intervention terminée",
  cancelled: "Annulée",
  unmatched: "Aucun professionnel disponible",
  disputed: "Litige",
};

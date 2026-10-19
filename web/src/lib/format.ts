import { getMarket } from "./market";

export function money(n: number) {
  const m = getMarket();
  return new Intl.NumberFormat(m.currencyLocale, {
    style: "currency",
    currency: m.currency,
    maximumFractionDigits: 0,
  }).format(n);
}

export function moneyExact(n: number) {
  const m = getMarket();
  return new Intl.NumberFormat(m.currencyLocale, {
    style: "currency",
    currency: m.currency,
  }).format(n);
}

export function km(n: number) {
  const m = getMarket();
  const formatted = n.toFixed(1);
  return m.defaultLocale.startsWith("fr")
    ? `${formatted.replace(".", ",")} km`
    : `${formatted} km`;
}

export function stars(n: number) {
  const m = getMarket();
  const formatted = n.toFixed(1);
  return m.defaultLocale.startsWith("fr") ? formatted.replace(".", ",") : formatted;
}

export function displayName(first: string, last: string) {
  return `${first} ${last.charAt(0).toUpperCase()}.`;
}

export function formatDate(iso: string) {
  const m = getMarket();
  return new Date(iso).toLocaleString(m.currencyLocale, {
    timeZone: m.timeZone === "UTC" ? undefined : m.timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(iso: string) {
  const m = getMarket();
  return new Date(iso).toLocaleTimeString(m.currencyLocale, {
    timeZone: m.timeZone === "UTC" ? undefined : m.timeZone,
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

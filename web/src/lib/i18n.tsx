"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { allWorldLanguages, isValidLanguageCode, type LanguageOption } from "./languages";

type Dict = Record<string, string>;

const FR: Dict = {
  language: "Langue",
  languageSettings: "Langue de l’application",
  languageHint: "Toutes les langues du monde (ISO). L’interface bascule pour les langues traduites ; sinon anglais.",
  saveLanguage: "Enregistrer la langue",
  searchLanguage: "Rechercher une langue…",
  account: "Compte",
  home: "Accueil",
  missions: "Missions",
  wallet: "Wallet",
  messages: "Messages",
  assistant: "Assistant",
  settings: "Réglages",
  logout: "Se déconnecter",
  saved: "Langue enregistrée",
  currentLanguage: "Langue actuelle",
};

const EN: Dict = {
  language: "Language",
  languageSettings: "App language",
  languageHint: "Every world language (ISO). UI switches for translated languages; otherwise English.",
  saveLanguage: "Save language",
  searchLanguage: "Search a language…",
  account: "Account",
  home: "Home",
  missions: "Missions",
  wallet: "Wallet",
  messages: "Messages",
  assistant: "Assistant",
  settings: "Settings",
  logout: "Log out",
  saved: "Language saved",
  currentLanguage: "Current language",
};

const ES: Dict = {
  ...EN,
  language: "Idioma",
  languageSettings: "Idioma de la aplicación",
  saveLanguage: "Guardar idioma",
  searchLanguage: "Buscar un idioma…",
  account: "Cuenta",
  home: "Inicio",
  missions: "Misiones",
  messages: "Mensajes",
  assistant: "Asistente",
  settings: "Ajustes",
  logout: "Cerrar sesión",
  saved: "Idioma guardado",
  currentLanguage: "Idioma actual",
};

const DE: Dict = {
  ...EN,
  language: "Sprache",
  languageSettings: "App-Sprache",
  saveLanguage: "Sprache speichern",
  searchLanguage: "Sprache suchen…",
  account: "Konto",
  home: "Start",
  missions: "Aufträge",
  messages: "Nachrichten",
  assistant: "Assistent",
  settings: "Einstellungen",
  logout: "Abmelden",
  saved: "Sprache gespeichert",
  currentLanguage: "Aktuelle Sprache",
};

const IT: Dict = {
  ...EN,
  language: "Lingua",
  languageSettings: "Lingua dell’app",
  saveLanguage: "Salva lingua",
  searchLanguage: "Cerca una lingua…",
  account: "Account",
  home: "Home",
  missions: "Missioni",
  messages: "Messaggi",
  assistant: "Assistente",
  settings: "Impostazioni",
  logout: "Esci",
  saved: "Lingua salvata",
  currentLanguage: "Lingua attuale",
};

const AR: Dict = {
  ...EN,
  language: "اللغة",
  languageSettings: "لغة التطبيق",
  saveLanguage: "حفظ اللغة",
  searchLanguage: "البحث عن لغة…",
  account: "الحساب",
  home: "الرئيسية",
  missions: "المهام",
  messages: "الرسائل",
  assistant: "المساعد",
  settings: "الإعدادات",
  logout: "تسجيل الخروج",
  saved: "تم حفظ اللغة",
  currentLanguage: "اللغة الحالية",
};

const TR: Dict = {
  ...EN,
  language: "Dil",
  languageSettings: "Uygulama dili",
  saveLanguage: "Dili kaydet",
  searchLanguage: "Dil ara…",
  account: "Hesap",
  home: "Ana sayfa",
  missions: "Görevler",
  messages: "Mesajlar",
  assistant: "Asistan",
  settings: "Ayarlar",
  logout: "Çıkış",
  saved: "Dil kaydedildi",
  currentLanguage: "Geçerli dil",
};

const PT: Dict = {
  ...EN,
  language: "Idioma",
  languageSettings: "Idioma do aplicativo",
  saveLanguage: "Salvar idioma",
  searchLanguage: "Pesquisar idioma…",
  account: "Conta",
  home: "Início",
  missions: "Missões",
  messages: "Mensagens",
  assistant: "Assistente",
  settings: "Configurações",
  logout: "Sair",
  saved: "Idioma salvo",
  currentLanguage: "Idioma atual",
};

const DICTS: Record<string, Dict> = {
  fr: FR,
  en: EN,
  es: ES,
  de: DE,
  it: IT,
  ar: AR,
  tr: TR,
  pt: PT,
  "pt-BR": PT,
  nb: EN,
  nn: EN,
  no: EN,
};

type LocaleCtx = {
  locale: string;
  setLocale: (code: string) => void;
  t: (key: string) => string;
  languages: LanguageOption[];
  dir: "ltr" | "rtl";
};

const Ctx = createContext<LocaleCtx | null>(null);
const STORAGE_KEY = "appo_locale";
const RTL = new Set(["ar", "he", "fa", "ur", "ps", "sd", "yi"]);

function resolveDict(locale: string): Dict {
  if (DICTS[locale]) return DICTS[locale];
  const base = locale.split("-")[0];
  return DICTS[base] ?? EN;
}

export function LocaleProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale?: string | null;
}) {
  const [locale, setLocaleState] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && isValidLanguageCode(saved)) return saved;
    }
    if (initialLocale && isValidLanguageCode(initialLocale)) return initialLocale;
    return "fr";
  });

  useEffect(() => {
    if (initialLocale && isValidLanguageCode(initialLocale) && initialLocale !== locale) {
      setLocaleState(initialLocale);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLocale]);

  const setLocale = useCallback((code: string) => {
    if (!isValidLanguageCode(code)) return;
    setLocaleState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = locale;
    root.dir = RTL.has(locale.split("-")[0]) ? "rtl" : "ltr";
  }, [locale]);

  const languages = useMemo(() => allWorldLanguages(locale.startsWith("fr") ? "fr" : "en"), [locale]);
  const dict = useMemo(() => resolveDict(locale), [locale]);
  const t = useCallback((key: string) => dict[key] ?? EN[key] ?? key, [dict]);
  const dir: "ltr" | "rtl" = RTL.has(locale.split("-")[0]) ? "rtl" : "ltr";

  const value = useMemo(
    () => ({ locale, setLocale, t, languages, dir }),
    [locale, setLocale, t, languages, dir],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLocale() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    return {
      locale: "fr",
      setLocale: () => undefined,
      t: (key: string) => FR[key] ?? key,
      languages: allWorldLanguages("fr"),
      dir: "ltr" as const,
    };
  }
  return ctx;
}

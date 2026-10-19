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
import { resolveAutoLocale } from "./locale-country";

type Dict = Record<string, string>;

const FR: Dict = {
  language: "Langue",
  languageSettings: "Langue de l’application",
  languageHint:
    "La langue suit automatiquement votre pays. Vous pouvez forcer une autre langue ci-dessous.",
  languageAuto: "Automatique (selon le pays)",
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
  invoices: "Factures",
  requests: "Demandes",
  planning: "Planning",
  profile: "Profil",
  clientSpace: "Espace client",
  proSpace: "Espace Pro",
  loading: "Chargement…",
  login: "Connexion",
  createAccount: "Créer un compte",
  needPro: "J’ai besoin d’un pro",
  iAmPro: "Je suis professionnel",
  tagline: "Le bon pro, sans attendre",
  heroTitle1: "Votre besoin.",
  heroTitle2: "Le bon pro.",
  heroBody:
    "Plomberie, électricité, serrurerie… AppO trouve un professionnel vérifié autour de vous, suit la mission et sécurise le paiement.",
  verifiedPros: "Pros vérifiés",
  securePay: "Paiement sécurisé",
  appoNow: "AppO Now",
  step1t: "Dites votre besoin",
  step1d: "Choisissez un service, maintenant ou plus tard.",
  step2t: "Un pro accepte",
  step2d: "AppO trouve un professionnel vérifié autour de vous.",
  step3t: "Suivez-le en direct",
  step3d: "Carte, ETA, messages, appel.",
  step4t: "Payez dans l’app",
  step4d: "Commission transparente. Avis après mission.",
  legal: "Légal",
  alreadyRegistered: "Déjà inscrit ?",
  signIn: "Se connecter",
  firstName: "Prénom",
  lastName: "Nom",
  email: "E-mail",
  phone: "Téléphone",
  password: "Mot de passe (8 caractères min.)",
  client: "Client",
  pro: "AppO Pro",
  registerTitle: "Créer un compte",
  registerHint: "Renseignez vos informations pour être opérationnel immédiatement.",
  marketLabel: "Marché",
  addressIntervention: "Adresse d’intervention",
  addressGpsHint: "Recherche OpenStreetMap ou position GPS — coordonnées exactes.",
  addressWorldwide: "OpenStreetMap / GPS — adresses mondiales.",
  company: "Entreprise",
  acceptTerms: "J’accepte les",
  andThe: "et la",
  cgu: "CGU",
  privacy: "politique de confidentialité",
  refunds: "politique d’annulation & remboursements",
  createClient: "Créer mon compte",
  createPro: "Créer mon compte Pro",
  detectedCountry: "Pays détecté",
  autoLanguageOn: "Langue auto selon le pays",
};

const EN: Dict = {
  language: "Language",
  languageSettings: "App language",
  languageHint: "Language follows your country automatically. You can override it below.",
  languageAuto: "Automatic (by country)",
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
  invoices: "Invoices",
  requests: "Requests",
  planning: "Schedule",
  profile: "Profile",
  clientSpace: "Client area",
  proSpace: "Pro area",
  loading: "Loading…",
  login: "Log in",
  createAccount: "Create account",
  needPro: "I need a pro",
  iAmPro: "I’m a professional",
  tagline: "The right pro, right away",
  heroTitle1: "Your need.",
  heroTitle2: "The right pro.",
  heroBody:
    "Plumbing, electrical, locksmith… AppO finds a verified pro near you, tracks the job and secures payment.",
  verifiedPros: "Verified pros",
  securePay: "Secure payment",
  appoNow: "AppO Now",
  step1t: "Describe your need",
  step1d: "Pick a service, now or later.",
  step2t: "A pro accepts",
  step2d: "AppO finds a verified professional near you.",
  step3t: "Track live",
  step3d: "Map, ETA, messages, call.",
  step4t: "Pay in the app",
  step4d: "Clear fees. Review after the job.",
  legal: "Legal",
  alreadyRegistered: "Already registered?",
  signIn: "Sign in",
  firstName: "First name",
  lastName: "Last name",
  email: "Email",
  phone: "Phone",
  password: "Password (min. 8 characters)",
  client: "Client",
  pro: "AppO Pro",
  registerTitle: "Create an account",
  registerHint: "Enter your details to get started right away.",
  marketLabel: "Market",
  addressIntervention: "Service address",
  addressGpsHint: "OpenStreetMap search or GPS — exact coordinates.",
  addressWorldwide: "OpenStreetMap / GPS — worldwide addresses.",
  company: "Company",
  acceptTerms: "I accept the",
  andThe: "and the",
  cgu: "Terms",
  privacy: "privacy policy",
  refunds: "cancellation & refund policy",
  createClient: "Create my account",
  createPro: "Create my Pro account",
  detectedCountry: "Detected country",
  autoLanguageOn: "Auto language by country",
};

const ES: Dict = {
  ...EN,
  language: "Idioma",
  languageSettings: "Idioma de la aplicación",
  languageHint: "El idioma sigue automáticamente tu país. Puedes cambiarlo abajo.",
  languageAuto: "Automático (según el país)",
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
  invoices: "Facturas",
  requests: "Solicitudes",
  planning: "Agenda",
  profile: "Perfil",
  clientSpace: "Espacio cliente",
  proSpace: "Espacio Pro",
  loading: "Cargando…",
  login: "Iniciar sesión",
  createAccount: "Crear cuenta",
  needPro: "Necesito un profesional",
  iAmPro: "Soy profesional",
  tagline: "El profesional adecuado, al instante",
  heroTitle1: "Tu necesidad.",
  heroTitle2: "El profesional adecuado.",
  heroBody:
    "Fontanería, electricidad, cerrajería… AppO encuentra un profesional verificado cerca de ti, sigue el trabajo y asegura el pago.",
  verifiedPros: "Pros verificados",
  securePay: "Pago seguro",
  step1t: "Describe tu necesidad",
  step1d: "Elige un servicio, ahora o más tarde.",
  step2t: "Un pro acepta",
  step2d: "AppO encuentra un profesional verificado cerca de ti.",
  step3t: "Síguelo en directo",
  step3d: "Mapa, ETA, mensajes, llamada.",
  step4t: "Paga en la app",
  step4d: "Comisión clara. Opinión después del trabajo.",
  legal: "Legal",
  alreadyRegistered: "¿Ya tienes cuenta?",
  signIn: "Iniciar sesión",
  firstName: "Nombre",
  lastName: "Apellido",
  email: "Correo",
  phone: "Teléfono",
  password: "Contraseña (mín. 8 caracteres)",
  registerTitle: "Crear una cuenta",
  registerHint: "Completa tus datos para empezar de inmediato.",
  marketLabel: "Mercado",
  addressIntervention: "Dirección de intervención",
  company: "Empresa",
  acceptTerms: "Acepto los",
  andThe: "y la",
  createClient: "Crear mi cuenta",
  createPro: "Crear mi cuenta Pro",
  detectedCountry: "País detectado",
  autoLanguageOn: "Idioma automático según el país",
};

const DE: Dict = {
  ...EN,
  language: "Sprache",
  languageSettings: "App-Sprache",
  languageHint: "Die Sprache folgt automatisch Ihrem Land. Unten können Sie sie überschreiben.",
  languageAuto: "Automatisch (nach Land)",
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
  invoices: "Rechnungen",
  requests: "Anfragen",
  planning: "Planung",
  profile: "Profil",
  clientSpace: "Kundenbereich",
  proSpace: "Pro-Bereich",
  loading: "Laden…",
  login: "Anmelden",
  createAccount: "Konto erstellen",
  needPro: "Ich brauche einen Profi",
  iAmPro: "Ich bin Profi",
  tagline: "Der richtige Profi, sofort",
  heroTitle1: "Ihr Bedarf.",
  heroTitle2: "Der richtige Profi.",
  heroBody:
    "Sanitär, Elektrik, Schlüsseldienst… AppO findet einen geprüften Profi in Ihrer Nähe, verfolgt den Auftrag und sichert die Zahlung.",
  verifiedPros: "Geprüfte Pros",
  securePay: "Sichere Zahlung",
  step1t: "Bedarf beschreiben",
  step1d: "Service wählen, jetzt oder später.",
  step2t: "Ein Profi akzeptiert",
  step2d: "AppO findet einen geprüften Profi in Ihrer Nähe.",
  step3t: "Live verfolgen",
  step3d: "Karte, ETA, Nachrichten, Anruf.",
  step4t: "In der App bezahlen",
  step4d: "Transparente Gebühren. Bewertung danach.",
  legal: "Rechtliches",
  alreadyRegistered: "Schon registriert?",
  signIn: "Anmelden",
  firstName: "Vorname",
  lastName: "Nachname",
  email: "E-Mail",
  phone: "Telefon",
  password: "Passwort (mind. 8 Zeichen)",
  registerTitle: "Konto erstellen",
  registerHint: "Geben Sie Ihre Daten ein, um sofort zu starten.",
  marketLabel: "Markt",
  addressIntervention: "Einsatzadresse",
  company: "Unternehmen",
  acceptTerms: "Ich akzeptiere die",
  andThe: "und die",
  createClient: "Mein Konto erstellen",
  createPro: "Mein Pro-Konto erstellen",
  detectedCountry: "Erkanntes Land",
  autoLanguageOn: "Automatische Sprache nach Land",
};

const IT: Dict = {
  ...EN,
  language: "Lingua",
  languageSettings: "Lingua dell’app",
  languageHint: "La lingua segue automaticamente il tuo paese. Puoi cambiarla qui sotto.",
  languageAuto: "Automatica (per paese)",
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
  invoices: "Fatture",
  requests: "Richieste",
  planning: "Planning",
  profile: "Profilo",
  clientSpace: "Area cliente",
  proSpace: "Area Pro",
  loading: "Caricamento…",
  login: "Accedi",
  createAccount: "Crea account",
  needPro: "Ho bisogno di un pro",
  iAmPro: "Sono un professionista",
  tagline: "Il pro giusto, subito",
  heroTitle1: "La tua esigenza.",
  heroTitle2: "Il pro giusto.",
  heroBody:
    "Idraulica, elettricità, fabbro… AppO trova un professionista verificato vicino a te, segue il lavoro e protegge il pagamento.",
  verifiedPros: "Pro verificati",
  securePay: "Pagamento sicuro",
  step1t: "Descrivi il bisogno",
  step1d: "Scegli un servizio, ora o dopo.",
  step2t: "Un pro accetta",
  step2d: "AppO trova un professionista verificato vicino a te.",
  step3t: "Segui in diretta",
  step3d: "Mappa, ETA, messaggi, chiamata.",
  step4t: "Paga nell’app",
  step4d: "Commissioni chiare. Recensione dopo.",
  legal: "Legale",
  alreadyRegistered: "Già registrato?",
  signIn: "Accedi",
  firstName: "Nome",
  lastName: "Cognome",
  email: "Email",
  phone: "Telefono",
  password: "Password (min. 8 caratteri)",
  registerTitle: "Crea un account",
  registerHint: "Inserisci i tuoi dati per iniziare subito.",
  marketLabel: "Mercato",
  addressIntervention: "Indirizzo di intervento",
  company: "Azienda",
  acceptTerms: "Accetto i",
  andThe: "e la",
  createClient: "Crea il mio account",
  createPro: "Crea il mio account Pro",
  detectedCountry: "Paese rilevato",
  autoLanguageOn: "Lingua automatica per paese",
};

const AR: Dict = {
  ...EN,
  language: "اللغة",
  languageSettings: "لغة التطبيق",
  languageHint: "تتبع اللغة بلدك تلقائيًا. يمكنك تغييرها أدناه.",
  languageAuto: "تلقائي (حسب البلد)",
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
  invoices: "الفواتير",
  requests: "الطلبات",
  planning: "الجدول",
  profile: "الملف",
  clientSpace: "مساحة العميل",
  proSpace: "مساحة المحترف",
  loading: "جارٍ التحميل…",
  login: "تسجيل الدخول",
  createAccount: "إنشاء حساب",
  needPro: "أحتاج محترفًا",
  iAmPro: "أنا محترف",
  tagline: "المحترف المناسب فورًا",
  heroTitle1: "احتياجك.",
  heroTitle2: "المحترف المناسب.",
  heroBody:
    "سباكة، كهرباء، أقفال… AppO يجد محترفًا موثوقًا قربك ويتابع المهمة ويؤمّن الدفع.",
  verifiedPros: "محترفون موثوقون",
  securePay: "دفع آمن",
  legal: "قانوني",
  alreadyRegistered: "لديك حساب؟",
  signIn: "تسجيل الدخول",
  firstName: "الاسم",
  lastName: "العائلة",
  email: "البريد",
  phone: "الهاتف",
  password: "كلمة المرور (8 أحرف على الأقل)",
  registerTitle: "إنشاء حساب",
  createClient: "إنشاء حسابي",
  createPro: "إنشاء حساب المحترف",
  detectedCountry: "البلد المكتشف",
  autoLanguageOn: "لغة تلقائية حسب البلد",
};

const TR: Dict = {
  ...EN,
  language: "Dil",
  languageSettings: "Uygulama dili",
  languageHint: "Dil ülkenize göre otomatik değişir. Aşağıdan değiştirebilirsiniz.",
  languageAuto: "Otomatik (ülkeye göre)",
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
  invoices: "Faturalar",
  requests: "Talepler",
  planning: "Planlama",
  profile: "Profil",
  clientSpace: "Müşteri alanı",
  proSpace: "Pro alanı",
  loading: "Yükleniyor…",
  login: "Giriş",
  createAccount: "Hesap oluştur",
  needPro: "Bir profesyonele ihtiyacım var",
  iAmPro: "Profesyonelim",
  tagline: "Doğru pro, hemen",
  heroTitle1: "İhtiyacınız.",
  heroTitle2: "Doğru pro.",
  legal: "Yasal",
  alreadyRegistered: "Zaten kayıtlı mısınız?",
  signIn: "Giriş yap",
  firstName: "Ad",
  lastName: "Soyad",
  email: "E-posta",
  phone: "Telefon",
  password: "Şifre (en az 8 karakter)",
  registerTitle: "Hesap oluştur",
  createClient: "Hesabımı oluştur",
  createPro: "Pro hesabımı oluştur",
  detectedCountry: "Algılanan ülke",
  autoLanguageOn: "Ülkeye göre otomatik dil",
};

const PT: Dict = {
  ...EN,
  language: "Idioma",
  languageSettings: "Idioma do aplicativo",
  languageHint: "O idioma segue automaticamente o seu país. Pode alterar abaixo.",
  languageAuto: "Automático (por país)",
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
  invoices: "Faturas",
  requests: "Pedidos",
  planning: "Agenda",
  profile: "Perfil",
  clientSpace: "Área do cliente",
  proSpace: "Área Pro",
  loading: "Carregando…",
  login: "Entrar",
  createAccount: "Criar conta",
  needPro: "Preciso de um profissional",
  iAmPro: "Sou profissional",
  tagline: "O profissional certo, agora",
  heroTitle1: "A sua necessidade.",
  heroTitle2: "O profissional certo.",
  legal: "Legal",
  alreadyRegistered: "Já tem conta?",
  signIn: "Entrar",
  firstName: "Nome",
  lastName: "Apelido",
  email: "E-mail",
  phone: "Telefone",
  password: "Palavra-passe (mín. 8 caracteres)",
  registerTitle: "Criar uma conta",
  createClient: "Criar a minha conta",
  createPro: "Criar a minha conta Pro",
  detectedCountry: "País detetado",
  autoLanguageOn: "Idioma automático por país",
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
  setLocale: (code: string, opts?: { manual?: boolean }) => void;
  enableAutoLocale: () => void;
  autoMode: boolean;
  countryCode: string | null;
  localeSource: string | null;
  t: (key: string) => string;
  languages: LanguageOption[];
  dir: "ltr" | "rtl";
};

const Ctx = createContext<LocaleCtx | null>(null);
const STORAGE_KEY = "appo_locale";
const MANUAL_KEY = "appo_locale_manual";
const COUNTRY_KEY = "appo_detected_country";
const RTL = new Set(["ar", "he", "fa", "ur", "ps", "sd", "yi"]);

function resolveDict(locale: string): Dict {
  if (DICTS[locale]) return DICTS[locale];
  const base = locale.split("-")[0];
  return DICTS[base] ?? EN;
}

function readManual(): boolean {
  try {
    return localStorage.getItem(MANUAL_KEY) === "1";
  } catch {
    return false;
  }
}

async function detectGpsCountry(): Promise<string | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return null;
  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 600_000,
      });
    });
    const res = await fetch(
      `/api/geocode?mode=reverse&lat=${encodeURIComponent(String(pos.coords.latitude))}&lng=${encodeURIComponent(String(pos.coords.longitude))}`,
    );
    if (!res.ok) return null;
    const json = await res.json();
    const code = json?.result?.countryCode as string | null | undefined;
    return code || null;
  } catch {
    return null;
  }
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
  const [autoMode, setAutoMode] = useState(() => (typeof window !== "undefined" ? !readManual() : true));
  const [countryCode, setCountryCode] = useState<string | null>(() => {
    try {
      return localStorage.getItem(COUNTRY_KEY);
    } catch {
      return null;
    }
  });
  const [localeSource, setLocaleSource] = useState<string | null>(null);

  const applyAuto = useCallback((next: string, country: string | null, source: string) => {
    if (!isValidLanguageCode(next)) return;
    setLocaleState(next);
    setCountryCode(country);
    setLocaleSource(source);
    try {
      localStorage.setItem(STORAGE_KEY, next);
      if (country) localStorage.setItem(COUNTRY_KEY, country);
      else localStorage.removeItem(COUNTRY_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function syncFromCountry() {
      if (readManual()) {
        setAutoMode(false);
        return;
      }
      setAutoMode(true);

      let marketCountry: string | null = null;
      let marketDefault: string | null = null;
      try {
        const res = await fetch("/api/market", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          marketCountry = json?.market?.countryCode ?? null;
          marketDefault = json?.market?.defaultLocale ?? null;
        }
      } catch {
        /* ignore */
      }

      // Fixed market country → language immediately
      if (marketCountry) {
        const resolved = resolveAutoLocale({
          marketCountryCode: marketCountry,
          marketDefaultLocale: marketDefault,
        });
        if (!cancelled) applyAuto(resolved.locale, resolved.countryCode, resolved.source);
        return;
      }

      // International: browser region first, then GPS country
      const browser = resolveAutoLocale({
        marketDefaultLocale: marketDefault,
        browserLanguages: typeof navigator !== "undefined" ? navigator.languages : undefined,
      });
      if (!cancelled) applyAuto(browser.locale, browser.countryCode, browser.source);

      const gpsCountry = await detectGpsCountry();
      if (cancelled || readManual() || !gpsCountry) return;
      const fromGps = resolveAutoLocale({
        gpsCountryCode: gpsCountry,
        marketDefaultLocale: marketDefault,
        browserLanguages: typeof navigator !== "undefined" ? navigator.languages : undefined,
      });
      applyAuto(fromGps.locale, fromGps.countryCode, fromGps.source);
    }

    void syncFromCountry();
    return () => {
      cancelled = true;
    };
  }, [applyAuto]);

  useEffect(() => {
    if (initialLocale && isValidLanguageCode(initialLocale) && readManual()) {
      setLocaleState(initialLocale);
    }
  }, [initialLocale]);

  const setLocale = useCallback((code: string, opts?: { manual?: boolean }) => {
    if (!isValidLanguageCode(code)) return;
    setLocaleState(code);
    const manual = opts?.manual !== false;
    setAutoMode(!manual);
    try {
      localStorage.setItem(STORAGE_KEY, code);
      if (manual) localStorage.setItem(MANUAL_KEY, "1");
      else localStorage.removeItem(MANUAL_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const enableAutoLocale = useCallback(() => {
    try {
      localStorage.removeItem(MANUAL_KEY);
    } catch {
      /* ignore */
    }
    setAutoMode(true);
    // Re-run detection
    void (async () => {
      let marketCountry: string | null = null;
      let marketDefault: string | null = null;
      try {
        const res = await fetch("/api/market", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          marketCountry = json?.market?.countryCode ?? null;
          marketDefault = json?.market?.defaultLocale ?? null;
        }
      } catch {
        /* ignore */
      }
      const gpsCountry = marketCountry ? null : await detectGpsCountry();
      const resolved = resolveAutoLocale({
        marketCountryCode: marketCountry,
        marketDefaultLocale: marketDefault,
        gpsCountryCode: gpsCountry,
        browserLanguages: typeof navigator !== "undefined" ? navigator.languages : undefined,
      });
      applyAuto(resolved.locale, resolved.countryCode, resolved.source);
    })();
  }, [applyAuto]);

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
    () => ({
      locale,
      setLocale,
      enableAutoLocale,
      autoMode,
      countryCode,
      localeSource,
      t,
      languages,
      dir,
    }),
    [locale, setLocale, enableAutoLocale, autoMode, countryCode, localeSource, t, languages, dir],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLocale() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    return {
      locale: "fr",
      setLocale: () => undefined,
      enableAutoLocale: () => undefined,
      autoMode: true,
      countryCode: null as string | null,
      localeSource: null as string | null,
      t: (key: string) => FR[key] ?? key,
      languages: allWorldLanguages("fr"),
      dir: "ltr" as const,
    };
  }
  return ctx;
}

/** Map nav French labels → i18n keys */
export function translateNavLabel(label: string, t: (k: string) => string): string {
  const map: Record<string, string> = {
    Accueil: "home",
    Assistant: "assistant",
    Missions: "missions",
    Factures: "invoices",
    Wallet: "wallet",
    Messages: "messages",
    Compte: "account",
    Demandes: "requests",
    Planning: "planning",
    Profil: "profile",
  };
  const key = map[label];
  return key ? t(key) : label;
}

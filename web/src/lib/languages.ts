/** ISO 639-1 language codes — virtually all languages with a standard 2-letter code. */
export const WORLD_LANGUAGE_CODES = [
  "aa","ab","ae","af","ak","am","an","ar","as","av","ay","az",
  "ba","be","bg","bh","bi","bm","bn","bo","br","bs",
  "ca","ce","ch","co","cr","cs","cu","cv","cy",
  "da","de","dv","dz",
  "ee","el","en","eo","es","et","eu",
  "fa","ff","fi","fj","fo","fr","fy",
  "ga","gd","gl","gn","gu","gv",
  "ha","he","hi","ho","hr","ht","hu","hy","hz",
  "ia","id","ie","ig","ii","ik","io","is","it","iu",
  "ja","jv",
  "ka","kg","ki","kj","kk","kl","km","kn","ko","kr","ks","ku","kv","kw","ky",
  "la","lb","lg","li","ln","lo","lt","lu","lv",
  "mg","mh","mi","mk","ml","mn","mr","ms","mt","my",
  "na","nb","nd","ne","ng","nl","nn","no","nr","nv","ny",
  "oc","oj","om","or","os",
  "pa","pi","pl","ps","pt",
  "qu",
  "rm","rn","ro","ru","rw",
  "sa","sc","sd","se","sg","si","sk","sl","sm","sn","so","sq","sr","ss","st","su","sv","sw",
  "ta","te","tg","th","ti","tk","tl","tn","to","tr","ts","tt","tw","ty",
  "ug","uk","ur","uz",
  "ve","vi","vo",
  "wa","wo",
  "xh",
  "yi","yo",
  "za","zh","zu",
] as const;

export type LanguageCode = (typeof WORLD_LANGUAGE_CODES)[number] | string;

export type LanguageOption = {
  code: string;
  name: string;
  nativeName: string;
};

const FALLBACK_NAMES: Record<string, string> = {
  fr: "French",
  en: "English",
  es: "Spanish",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  ar: "Arabic",
  tr: "Turkish",
  zh: "Chinese",
  ja: "Japanese",
  ko: "Korean",
  ru: "Russian",
  hi: "Hindi",
  bn: "Bengali",
  nl: "Dutch",
  pl: "Polish",
  uk: "Ukrainian",
  vi: "Vietnamese",
  th: "Thai",
  id: "Indonesian",
  ms: "Malay",
  sw: "Swahili",
  he: "Hebrew",
  fa: "Persian",
  ur: "Urdu",
  ro: "Romanian",
  cs: "Czech",
  el: "Greek",
  hu: "Hungarian",
  sv: "Swedish",
  da: "Danish",
  fi: "Finnish",
  no: "Norwegian",
  nb: "Norwegian Bokmål",
  ca: "Catalan",
  eu: "Basque",
  gl: "Galician",
  hr: "Croatian",
  sr: "Serbian",
  sk: "Slovak",
  sl: "Slovenian",
  bg: "Bulgarian",
  lt: "Lithuanian",
  lv: "Latvian",
  et: "Estonian",
  af: "Afrikaans",
  am: "Amharic",
  yo: "Yoruba",
  zu: "Zulu",
  xh: "Xhosa",
  ig: "Igbo",
  ha: "Hausa",
  so: "Somali",
  rw: "Kinyarwanda",
  mn: "Mongolian",
  my: "Burmese",
  km: "Khmer",
  lo: "Lao",
  ka: "Georgian",
  hy: "Armenian",
  az: "Azerbaijani",
  kk: "Kazakh",
  uz: "Uzbek",
  ky: "Kyrgyz",
  tg: "Tajik",
  tk: "Turkmen",
  ne: "Nepali",
  si: "Sinhala",
  ta: "Tamil",
  te: "Telugu",
  kn: "Kannada",
  ml: "Malayalam",
  mr: "Marathi",
  gu: "Gujarati",
  pa: "Punjabi",
  or: "Odia",
  as: "Assamese",
  jv: "Javanese",
  su: "Sundanese",
  tl: "Tagalog",
  ceb: "Cebuano",
  cy: "Welsh",
  ga: "Irish",
  gd: "Scottish Gaelic",
  is: "Icelandic",
  mt: "Maltese",
  sq: "Albanian",
  mk: "Macedonian",
  bs: "Bosnian",
  eo: "Esperanto",
  la: "Latin",
};

export function languageLabel(code: string, displayLocale = "fr"): LanguageOption {
  let name = FALLBACK_NAMES[code] ?? code.toUpperCase();
  let nativeName = name;
  try {
    if (typeof Intl !== "undefined" && "DisplayNames" in Intl) {
      const en = new Intl.DisplayNames([displayLocale, "en"], { type: "language" });
      const native = new Intl.DisplayNames([code, "en"], { type: "language" });
      name = en.of(code) || name;
      nativeName = native.of(code) || name;
    }
  } catch {
    /* ignore */
  }
  return { code, name, nativeName };
}

export function allWorldLanguages(displayLocale = "fr"): LanguageOption[] {
  return WORLD_LANGUAGE_CODES.map((code) => languageLabel(code, displayLocale)).sort((a, b) =>
    a.name.localeCompare(b.name, displayLocale),
  );
}

export function isValidLanguageCode(code: string) {
  return WORLD_LANGUAGE_CODES.includes(code as (typeof WORLD_LANGUAGE_CODES)[number]);
}

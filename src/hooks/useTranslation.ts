import { create } from 'zustand';
import enTranslations from '../locales/en.json';
import hiTranslations from '../locales/hi.json';
import mrTranslations from '../locales/mr.json';
import knTranslations from '../locales/kn.json';
import teTranslations from '../locales/te.json';
import { translateText as translateFromDict, VERNACULAR_TRANSLATIONS } from '../utils/vernacularDictionary';
import {
  translateText as translateViaGoogle,
  getCachedTranslation,
  setCachedTranslation
} from '../services/translationService';
import {
  translateEntirePage,
  restoreOriginalDOM
} from '../services/fullPageTranslator';

export type SupportedLanguage =
  | 'en'
  | 'hi'
  | 'mr'
  | 'kn'
  | 'te'
  | 'bn'
  | 'ta'
  | 'gu'
  | 'pa'
  | 'ml'
  | 'or'
  | 'ur'
  | 'as';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  native: string;
  speechCode: string;
}

export const INDIAN_LANGUAGES: readonly LanguageOption[] = [
  { code: 'en', name: 'English', native: 'English', speechCode: 'en-IN' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', speechCode: 'hi-IN' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', speechCode: 'mr-IN' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', speechCode: 'te-IN' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', speechCode: 'kn-IN' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', speechCode: 'bn-IN' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', speechCode: 'ta-IN' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', speechCode: 'gu-IN' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', speechCode: 'pa-IN' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം', speechCode: 'ml-IN' },
  { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ', speechCode: 'or-IN' },
  { code: 'ur', name: 'Urdu', native: 'اردو', speechCode: 'ur-IN' },
  { code: 'as', name: 'Assamese', native: 'অসমীয়া', speechCode: 'as-IN' },
] as const;

interface TranslationStore {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  toggleLanguage: () => void;
  t: (path: string) => string;
  translateAsync: (text: string, targetLang?: SupportedLanguage) => Promise<string>;
}

type TranslationTree = Record<string, unknown>;

const resources: Partial<Record<SupportedLanguage, TranslationTree>> = {
  en: enTranslations as unknown as TranslationTree,
  hi: hiTranslations as unknown as TranslationTree,
  mr: mrTranslations as unknown as TranslationTree,
  kn: knTranslations as unknown as TranslationTree,
  te: teTranslations as unknown as TranslationTree,
};

export const useTranslation = create<TranslationStore>((set, get) => ({
  language: (localStorage.getItem('crimenexus_lang') as SupportedLanguage) || 'en',

  setLanguage: (lang: SupportedLanguage) => {
    localStorage.setItem('crimenexus_lang', lang);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
    set({ language: lang });
    if (lang === 'en') {
      restoreOriginalDOM();
    } else {
      translateEntirePage(lang).catch((err) =>
        console.warn('Full page translation triggered error:', err)
      );
    }
  },

  toggleLanguage: () => {
    const langs: SupportedLanguage[] = [
      'en',
      'hi',
      'mr',
      'te',
      'kn',
      'bn',
      'ta',
      'gu',
      'pa',
      'ml',
      'or',
      'ur',
      'as'
    ];
    const currentIdx = langs.indexOf(get().language);
    const nextLang = langs[(currentIdx + 1) % langs.length];
    localStorage.setItem('crimenexus_lang', nextLang);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = nextLang;
    }
    set({ language: nextLang });
    if (nextLang === 'en') {
      restoreOriginalDOM();
    } else {
      translateEntirePage(nextLang).catch((err) =>
        console.warn('Full page translation triggered error:', err)
      );
    }
  },

  translateAsync: async (text: string, targetLang?: SupportedLanguage): Promise<string> => {
    const tl = targetLang || get().language;
    if (tl === 'en') return text;
    return translateViaGoogle(text, tl);
  },

  t: (path: string): string => {
    const currentLang = get().language;

    if (currentLang === 'en') {
      // Direct return for English or lookup in en json
      const currentBundle = resources.en;
      const keys = path.split('.');
      let val: unknown = currentBundle;
      for (const k of keys) {
        if (val && typeof val === 'object' && k in (val as Record<string, unknown>)) {
          val = (val as Record<string, unknown>)[k];
        } else {
          val = undefined;
          break;
        }
      }
      return typeof val === 'string' ? val : path;
    }

    // 1. Check Google Translate / Memory Cache
    const cached = getCachedTranslation(path, currentLang);
    if (cached) return cached;

    // 2. Direct vernacular dictionary translation for arbitrary UI phrases
    if (VERNACULAR_TRANSLATIONS[path.trim()]) {
      const dictHit = VERNACULAR_TRANSLATIONS[path.trim()][currentLang as Exclude<SupportedLanguage, 'en'>];
      if (dictHit) {
        setCachedTranslation(path, currentLang, dictHit);
        return dictHit;
      }
    }

    // 3. Check JSON locale bundles
    const currentBundle = resources[currentLang] || resources.en;
    const fallbackBundle = resources.en;

    const keys = path.split('.');
    let val: unknown = currentBundle;
    for (const k of keys) {
      if (val && typeof val === 'object' && k in (val as Record<string, unknown>)) {
        val = (val as Record<string, unknown>)[k];
      } else {
        val = undefined;
        break;
      }
    }

    if (val !== undefined && typeof val === 'string') {
      setCachedTranslation(path, currentLang, val);
      return val;
    }

    // 4. Check vernacular dictionary fallback
    const vernacular = translateFromDict(path, currentLang);
    if (vernacular !== path) {
      setCachedTranslation(path, currentLang, vernacular);
      return vernacular;
    }

    // 5. Fire background Google Translate free fetch so next render displays it
    if (path.length > 1 && !path.includes('.')) {
      translateViaGoogle(path, currentLang).then((result) => {
        if (result && result !== path) {
          setCachedTranslation(path, currentLang, result);
        }
      }).catch(() => {});
    }

    // 6. Fallback to English JSON
    let fallbackVal: unknown = fallbackBundle;
    for (const k of keys) {
      if (fallbackVal && typeof fallbackVal === 'object' && k in (fallbackVal as Record<string, unknown>)) {
        fallbackVal = (fallbackVal as Record<string, unknown>)[k];
      } else {
        return path;
      }
    }
    return typeof fallbackVal === 'string' ? fallbackVal : path;
  },
}));

// Auto-initialize full page translation on boot if a non-English language is active
if (typeof window !== 'undefined') {
  const initialLang = localStorage.getItem('crimenexus_lang') as SupportedLanguage | null;
  if (initialLang && initialLang !== 'en') {
    setTimeout(() => {
      translateEntirePage(initialLang).catch(() => {});
    }, 600);
  }
}


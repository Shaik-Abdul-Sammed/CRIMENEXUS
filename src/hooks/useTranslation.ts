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

export type SupportedLanguage = 'en' | 'hi' | 'mr' | 'kn' | 'te';

interface TranslationStore {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  toggleLanguage: () => void;
  t: (path: string) => string;
  translateAsync: (text: string, targetLang?: SupportedLanguage) => Promise<string>;
}

type TranslationTree = Record<string, unknown>;

const resources: Record<SupportedLanguage, TranslationTree> = {
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
  },

  toggleLanguage: () => {
    const langs: SupportedLanguage[] = ['en', 'hi', 'mr', 'kn', 'te'];
    const currentIdx = langs.indexOf(get().language);
    const nextLang = langs[(currentIdx + 1) % langs.length];
    localStorage.setItem('crimenexus_lang', nextLang);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = nextLang;
    }
    set({ language: nextLang });
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

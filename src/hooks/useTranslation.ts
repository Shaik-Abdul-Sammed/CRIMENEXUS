import { create } from 'zustand';
import enTranslations from '../locales/en.json';
import hiTranslations from '../locales/hi.json';
import mrTranslations from '../locales/mr.json';
import knTranslations from '../locales/kn.json';
import teTranslations from '../locales/te.json';

export type SupportedLanguage = 'en' | 'hi' | 'mr' | 'kn' | 'te';

interface TranslationStore {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  toggleLanguage: () => void;
  t: (path: string) => string;
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
    set({ language: lang });
  },

  toggleLanguage: () => {
    const langs: SupportedLanguage[] = ['en', 'hi', 'mr', 'kn', 'te'];
    const currentIdx = langs.indexOf(get().language);
    const nextLang = langs[(currentIdx + 1) % langs.length];
    localStorage.setItem('crimenexus_lang', nextLang);
    set({ language: nextLang });
  },

  t: (path: string): string => {
    const currentLang = get().language;
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

    if (val !== undefined && typeof val === 'string') return val;

    // Fallback to English
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

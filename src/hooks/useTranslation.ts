import { create } from 'zustand';
import enTranslations from '../locales/en.json';
import hiTranslations from '../locales/hi.json';

export type SupportedLanguage = 'en' | 'hi';

interface TranslationStore {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  toggleLanguage: () => void;
  t: (path: string) => string;
}

const resources = {
  en: enTranslations,
  hi: hiTranslations,
};

export const useTranslation = create<TranslationStore>((set, get) => ({
  language: (localStorage.getItem('crimenexus_lang') as SupportedLanguage) || 'en',

  setLanguage: (lang: SupportedLanguage) => {
    localStorage.setItem('crimenexus_lang', lang);
    set({ language: lang });
  },

  toggleLanguage: () => {
    const nextLang: SupportedLanguage = get().language === 'en' ? 'hi' : 'en';
    localStorage.setItem('crimenexus_lang', nextLang);
    set({ language: nextLang });
  },

  t: (path: string): string => {
    const currentLang = get().language;
    const currentBundle = resources[currentLang] || resources.en;
    const fallbackBundle = resources.en;

    const keys = path.split('.');
    let val: any = currentBundle;
    for (const k of keys) {
      if (val && typeof val === 'object' && k in val) {
        val = val[k];
      } else {
        val = undefined;
        break;
      }
    }

    if (val !== undefined && typeof val === 'string') return val;

    // Fallback to English
    let fallbackVal: any = fallbackBundle;
    for (const k of keys) {
      if (fallbackVal && typeof fallbackVal === 'object' && k in fallbackVal) {
        fallbackVal = fallbackVal[k];
      } else {
        return path;
      }
    }
    return typeof fallbackVal === 'string' ? fallbackVal : path;
  },
}));

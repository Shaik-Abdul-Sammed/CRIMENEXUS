/**
 * Sovereign Real-Time Translation Service.
 * Powered by Google Translate Free API with Backend /api/v1/translate proxy,
 * client-side direct endpoint fallback, and localized in-memory/sessionStorage cache.
 */

import { VERNACULAR_TRANSLATIONS, SupportedLanguage } from '../utils/vernacularDictionary';

const CACHE_PREFIX = 'cx_trans_';
const memoryCache = new Map<string, string>();

function getCacheKey(text: string, targetLang: string): string {
  return `${targetLang}:${text.trim()}`;
}

export function getCachedTranslation(text: string, targetLang: string): string | null {
  const key = getCacheKey(text, targetLang);
  if (memoryCache.has(key)) {
    return memoryCache.get(key)!;
  }
  try {
    const stored = sessionStorage.getItem(CACHE_PREFIX + key);
    if (stored) {
      memoryCache.set(key, stored);
      return stored;
    }
  } catch {
    // SessionStorage unavailable
  }
  return null;
}

export function setCachedTranslation(text: string, targetLang: string, translated: string): void {
  const key = getCacheKey(text, targetLang);
  memoryCache.set(key, translated);
  try {
    sessionStorage.setItem(CACHE_PREFIX + key, translated);
  } catch {
    // SessionStorage quota exceeded or unavailable
  }
}

/**
 * Translates text via the Google Translate Free Endpoint directly from the browser.
 */
async function translateViaGoogleDirect(
  text: string,
  targetLang: string,
  sourceLang: string = 'auto'
): Promise<string> {
  const sl = sourceLang === 'auto' ? 'auto' : sourceLang;
  const tl = targetLang;
  const url = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=${encodeURIComponent(
    sl
  )}&tl=${encodeURIComponent(tl)}&q=${encodeURIComponent(text)}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: '*/*'
    }
  });

  if (!res.ok) {
    throw new Error(`Google Translate Direct HTTP ${res.status}`);
  }

  const data = await res.json();
  if (Array.isArray(data) && data.length > 0) {
    const first = data[0];
    if (Array.isArray(first) && first.length > 0) {
      return String(first[0]);
    } else if (typeof first === 'string') {
      return first;
    }
  }
  return String(data);
}

/**
 * Primary translation function:
 * 1. Checks memory & sessionStorage cache
 * 2. Checks local vernacular dictionary for instantaneous zero-latency hit
 * 3. Calls CRIMENEXUS backend /api/v1/translate
 * 4. Fallback: Direct Google Translate free endpoint
 * 5. Returns translated string
 */
export async function translateText(
  text: string,
  targetLang: string,
  sourceLang: string = 'auto'
): Promise<string> {
  if (!text || !text.trim()) return '';
  const cleanText = text.trim();

  if (sourceLang !== 'auto' && sourceLang === targetLang) {
    return cleanText;
  }

  // 1. Cache hit
  const cached = getCachedTranslation(cleanText, targetLang);
  if (cached) return cached;

  // 2. Dictionary hit for common UI words
  if (
    targetLang !== 'en' &&
    VERNACULAR_TRANSLATIONS[cleanText] &&
    VERNACULAR_TRANSLATIONS[cleanText][targetLang as Exclude<SupportedLanguage, 'en'>]
  ) {
    const hit = VERNACULAR_TRANSLATIONS[cleanText][targetLang as Exclude<SupportedLanguage, 'en'>];
    setCachedTranslation(cleanText, targetLang, hit);
    return hit;
  }

  // 3. Backend /api/v1/translate API
  try {
    const response = await fetch('/api/v1/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: cleanText,
        target_lang: targetLang,
        source_lang: sourceLang
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.translated_text && data.translated_text.trim()) {
        const result = data.translated_text.trim();
        setCachedTranslation(cleanText, targetLang, result);
        return result;
      }
    }
  } catch (backendErr) {
    console.debug('Backend translation API unavailable, trying direct Google endpoint:', backendErr);
  }

  // 4. Fallback: Google Translate Free Direct
  try {
    const directResult = await translateViaGoogleDirect(cleanText, targetLang, sourceLang);
    if (directResult && directResult.trim()) {
      setCachedTranslation(cleanText, targetLang, directResult.trim());
      return directResult.trim();
    }
  } catch (directErr) {
    console.debug('Direct Google Translate free fallback failed:', directErr);
  }

  // Fallback to original text if offline
  return cleanText;
}

/**
 * Batch translation helper
 */
export async function translateBatch(
  texts: string[],
  targetLang: string,
  sourceLang: string = 'auto'
): Promise<string[]> {
  if (!texts || texts.length === 0) return [];

  const results: string[] = new Array(texts.length);
  const missingIndices: number[] = [];
  const missingTexts: string[] = [];

  // Check cache first
  texts.forEach((txt, idx) => {
    if (!txt || !txt.trim()) {
      results[idx] = '';
      return;
    }
    const cached = getCachedTranslation(txt.trim(), targetLang);
    if (cached) {
      results[idx] = cached;
    } else {
      missingIndices.push(idx);
      missingTexts.push(txt.trim());
    }
  });

  if (missingTexts.length === 0) {
    return results;
  }

  // Request backend batch endpoint
  try {
    const response = await fetch('/api/v1/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        texts: missingTexts,
        target_lang: targetLang,
        source_lang: sourceLang
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.translations) && data.translations.length === missingTexts.length) {
        data.translations.forEach((trans: string, i: number) => {
          const originalIdx = missingIndices[i];
          const originalTxt = missingTexts[i];
          const out = trans || originalTxt;
          results[originalIdx] = out;
          setCachedTranslation(originalTxt, targetLang, out);
        });
        return results;
      }
    }
  } catch (err) {
    console.debug('Backend batch translation failed, falling back to sequential:', err);
  }

  // Fallback: translate individually
  await Promise.all(
    missingTexts.map(async (txt, i) => {
      const originalIdx = missingIndices[i];
      const trans = await translateText(txt, targetLang, sourceLang);
      results[originalIdx] = trans;
    })
  );

  return results;
}

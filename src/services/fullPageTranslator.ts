/**
 * Full Page Real-Time DOM Translation Engine.
 * Automatically traverses DOM text nodes, translates them in batches via the
 * CRIMENEXUS Google Translate Free API proxy (/api/v1/translate) with
 * sessionStorage caching, updates nodes seamlessly, and listens to dynamic
 * mutations for route transitions, modals, and dynamic data.
 */

import { translateBatch, getCachedTranslation, setCachedTranslation } from './translationService';
import { SupportedLanguage } from '../hooks/useTranslation';

// WeakMap storing original English text for every traversed text node
const originalTextMap = new WeakMap<Node, string>();
const originalPlaceholderMap = new WeakMap<HTMLInputElement | HTMLTextAreaElement, string>();

let currentLang: SupportedLanguage = 'en';
let isTranslating = false;
let observer: MutationObserver | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

type TranslationListener = (status: { isTranslating: boolean; lang: SupportedLanguage }) => void;
const listeners = new Set<TranslationListener>();

function notifyListeners() {
  listeners.forEach((fn) => fn({ isTranslating, lang: currentLang }));
}

/**
 * Determines whether a text node should be skipped from translation.
 */
function shouldSkipNode(node: Node): boolean {
  const parent = node.parentElement;
  if (!parent) return true;

  // Technical and non-prose tags to ignore
  const ignoredTags = new Set([
    'SCRIPT',
    'STYLE',
    'NOSCRIPT',
    'CODE',
    'PRE',
    'SVG',
    'PATH',
    'CANVAS',
    'AUDIO',
    'VIDEO',
    'IFRAME'
  ]);
  if (ignoredTags.has(parent.tagName)) return true;

  // Elements marked as non-translatable or editable
  if (
    parent.closest('[data-no-translate]') ||
    parent.closest('.no-translate') ||
    parent.closest('[contenteditable="true"]') ||
    parent.closest('.lucide') ||
    parent.closest('.material-icons')
  ) {
    return true;
  }

  const text = node.nodeValue?.trim();
  if (!text || text.length <= 1) return true;

  // Skip pure numbers, pure punctuation, vehicle plates, or standalone symbols
  // e.g. "123", "+91 99999 88888", "₹ 5,00,000", "TS 09 AB 1234", "12:30 IST", "2026-11-18"
  if (/^[\d\s.,:;!?%+#@/\\_()\[\]{}\-–—*'"^$₹€£]+$/.test(text)) {
    return true;
  }

  // Skip vehicle registration codes like "MH 02 CZ 4400" or "TS 09 AB 1234"
  if (/^[A-Z]{2}\s*\d{1,2}\s*[A-Z]{1,3}\s*\d{4}$/i.test(text)) {
    return true;
  }

  // Skip hash digests or technical IDs
  if (/^[A-Fa-f0-9]{32,64}$/.test(text) || /^WANTED-[A-Z0-9-]+$/.test(text)) {
    return true;
  }

  return false;
}

/**
 * Collects all eligible text nodes and input placeholders within a root element.
 */
function collectTranslatableElements(root: HTMLElement): {
  nodes: Text[];
  inputs: (HTMLInputElement | HTMLTextAreaElement)[];
} {
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n: Node) => {
      return shouldSkipNode(n) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
    }
  });

  let currentNode = walker.nextNode();
  while (currentNode) {
    nodes.push(currentNode as Text);
    currentNode = walker.nextNode();
  }

  const inputs = Array.from(root.querySelectorAll('input[placeholder], textarea[placeholder]')).filter(
    (el) => !el.closest('[data-no-translate]') && !el.closest('.no-translate')
  ) as (HTMLInputElement | HTMLTextAreaElement)[];

  return { nodes, inputs };
}

/**
 * Translates a collection of text nodes and input elements to target language.
 */
async function processBatchTranslation(
  nodes: Text[],
  inputs: (HTMLInputElement | HTMLTextAreaElement)[],
  targetLang: SupportedLanguage
): Promise<void> {
  if (targetLang === 'en') return;

  // 1. Text Nodes
  const textsToTranslate: { node: Text; originalText: string }[] = [];
  const uniqueOriginalsSet = new Set<string>();

  for (const node of nodes) {
    let original = originalTextMap.get(node);
    if (!original) {
      original = (node.nodeValue || '').trim();
      originalTextMap.set(node, original);
    }
    if (original && original.length > 1) {
      textsToTranslate.push({ node, originalText: original });
      uniqueOriginalsSet.add(original);
    }
  }

  // 2. Input Placeholders
  const placeholdersToTranslate: {
    el: HTMLInputElement | HTMLTextAreaElement;
    originalPlaceholder: string;
  }[] = [];
  for (const el of inputs) {
    let orig = originalPlaceholderMap.get(el);
    if (!orig) {
      orig = (el.placeholder || '').trim();
      originalPlaceholderMap.set(el, orig);
    }
    if (orig && orig.length > 1 && !/^[\d\s.,:;!?%+#@/\-_]+$/.test(orig)) {
      placeholdersToTranslate.push({ el, originalPlaceholder: orig });
      uniqueOriginalsSet.add(orig);
    }
  }

  const uniqueArray = Array.from(uniqueOriginalsSet);
  if (uniqueArray.length === 0) return;

  // 1. Instantly apply existing cached translations to DOM text nodes for zero-latency UI update
  for (const { node, originalText } of textsToTranslate) {
    const cached = getCachedTranslation(originalText, targetLang);
    if (cached && node.nodeValue !== cached) {
      node.nodeValue = cached;
    }
  }
  for (const { el, originalPlaceholder } of placeholdersToTranslate) {
    const cached = getCachedTranslation(originalPlaceholder, targetLang);
    if (cached && el.placeholder !== cached) {
      el.placeholder = cached;
    }
  }

  // Separate cached vs uncached
  const uncached: string[] = [];
  uniqueArray.forEach((txt) => {
    if (!getCachedTranslation(txt, targetLang)) {
      uncached.push(txt);
    }
  });

  // Translate uncached in chunks of 25 using high-performance parallel backend
  const CHUNK_SIZE = 25;
  for (let i = 0; i < uncached.length; i += CHUNK_SIZE) {
    const chunk = uncached.slice(i, i + CHUNK_SIZE);
    try {
      const translatedChunk = await translateBatch(chunk, targetLang);
      translatedChunk.forEach((trans, cIdx) => {
        if (trans) {
          setCachedTranslation(chunk[cIdx], targetLang, trans);
        }
      });
    } catch (err) {
      console.warn('Batch translation error in chunk:', err);
    }
  }

  // 2. Apply newly translated values to DOM text nodes
  for (const { node, originalText } of textsToTranslate) {
    const translated = getCachedTranslation(originalText, targetLang);
    if (translated && node.nodeValue !== translated) {
      node.nodeValue = translated;
    }
  }

  // Apply translations to input placeholders
  for (const { el, originalPlaceholder } of placeholdersToTranslate) {
    const translated = getCachedTranslation(originalPlaceholder, targetLang);
    if (translated && el.placeholder !== translated) {
      el.placeholder = translated;
    }
  }
}

let isApplyingMutation = false;

/**
 * Observes DOM mutations and applies translation to dynamically added content.
 */
function setupMutationObserver(targetLang: SupportedLanguage) {
  if (observer) {
    observer.disconnect();
    observer = null;
  }

  if (targetLang === 'en') return;

  const rootElement = document.getElementById('root') || document.body;
  if (!rootElement) return;

  observer = new MutationObserver((mutations) => {
    if (isApplyingMutation) return;

    let hasRelevantChanges = false;
    for (const m of mutations) {
      if (m.type === 'childList' && m.addedNodes.length > 0) {
        hasRelevantChanges = true;
        break;
      }
      if (m.type === 'characterData') {
        const target = m.target;
        const orig = originalTextMap.get(target);
        if (orig && target.nodeValue !== getCachedTranslation(orig, currentLang)) {
          hasRelevantChanges = true;
          break;
        }
      }
    }

    if (hasRelevantChanges) {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (currentLang !== 'en') {
          const { nodes, inputs } = collectTranslatableElements(rootElement);
          isApplyingMutation = true;
          processBatchTranslation(nodes, inputs, currentLang)
            .catch(() => {})
            .finally(() => {
              setTimeout(() => {
                isApplyingMutation = false;
              }, 50);
            });
        }
      }, 100);
    }
  });

  observer.observe(rootElement, {
    childList: true,
    subtree: true,
    characterData: true
  });
}

/**
 * Restores all translated DOM elements back to their original English text.
 */
export function restoreOriginalDOM(): void {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }

  currentLang = 'en';
  isTranslating = false;

  const rootElement = document.getElementById('root') || document.body;
  if (!rootElement) return;

  const walker = document.createTreeWalker(rootElement, NodeFilter.SHOW_TEXT);
  let currentNode = walker.nextNode();
  while (currentNode) {
    const original = originalTextMap.get(currentNode);
    if (original !== undefined && currentNode.nodeValue !== original) {
      currentNode.nodeValue = original;
    }
    currentNode = walker.nextNode();
  }

  const inputs = rootElement.querySelectorAll('input[placeholder], textarea[placeholder]') as NodeListOf<
    HTMLInputElement | HTMLTextAreaElement
  >;
  inputs.forEach((el) => {
    const orig = originalPlaceholderMap.get(el);
    if (orig !== undefined && el.placeholder !== orig) {
      el.placeholder = orig;
    }
  });

  notifyListeners();
}

/**
 * Translates the entire current page DOM into the target Indian language.
 */
export async function translateEntirePage(targetLang: SupportedLanguage): Promise<void> {
  currentLang = targetLang;

  if (targetLang === 'en') {
    restoreOriginalDOM();
    return;
  }

  const rootElement = document.getElementById('root') || document.body;
  if (!rootElement) return;

  isTranslating = true;
  notifyListeners();

  try {
    const { nodes, inputs } = collectTranslatableElements(rootElement);
    await processBatchTranslation(nodes, inputs, targetLang);
    setupMutationObserver(targetLang);
  } catch (err) {
    console.error('Failed to translate entire page DOM:', err);
  } finally {
    isTranslating = false;
    notifyListeners();
  }
}

/**
 * Hook or subscriber for full page translation state.
 */
export function subscribeTranslationStatus(listener: TranslationListener): () => void {
  listeners.add(listener);
  listener({ isTranslating, lang: currentLang });
  return () => {
    listeners.delete(listener);
  };
}

export function getCurrentTranslationLang(): SupportedLanguage {
  return currentLang;
}

export function isPageTranslating(): boolean {
  return isTranslating;
}

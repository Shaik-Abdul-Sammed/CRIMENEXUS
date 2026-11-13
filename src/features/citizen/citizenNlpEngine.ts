/**
 * CRIMENEXUS Citizen Sentinel — Intelligent NLP Engine
 * Auto-corrects colloquial meaning, detects Indic/Romanized languages,
 * filters spam & unwanted messages, and structures raw complaints into formal Section 173 BNSS abstracts.
 */

export interface LanguageDetectionResult {
  code: 'en' | 'hi' | 'hinglish' | 'mr' | 'te' | 'kn' | 'ta' | 'bn' | 'gu' | 'pa' | 'ur';
  name: string;
  nativeName: string;
  confidence: number;
}

export interface SpamCheckResult {
  isSpamOrUnwanted: boolean;
  category?: 'GREETING' | 'GIBBERISH' | 'IRRELEVANT' | 'VULGAR_ABUSIVE' | 'TEST_INPUT';
  message?: string;
  severity: 'SAFE' | 'WARNING' | 'BLOCK';
}

export interface InvestigativeChecklist {
  hasWhen: boolean;
  hasWhere: boolean;
  hasWho: boolean;
  hasWhat: boolean;
  completenessScore: number; // 0 to 100
  suggestions: string[];
}

export interface FormalLegalCorrection {
  formalAbstract: string;
  statutorySections: string[];
  crimeClassification: string;
  normalizedKeywords: string[];
}

// Common spam / greeting dictionary
const COMMON_GREETING_WORDS = new Set([
  'hi', 'hello', 'hey', 'namaste', 'pranam', 'good', 'morning', 'evening',
  'afternoon', 'police', 'bhai', 'sunno', 'suno', 'kya', 'haal', 'how', 'are',
  'you', 'sup', 'yo', 'sir', 'ji', 'help', 'me', 'bolo', 'kripya'
]);

const COMMON_GREETINGS = [
  'hi', 'hello', 'hey', 'namaste', 'pranam', 'good morning', 'good evening',
  'good afternoon', 'police bhai', 'sunno police', 'kya haal', 'how are you',
  'sup', 'yo', 'bhai sun', 'suno', 'hello sir', 'sir ji', 'help me', 'namaste police bhai'
];

const GIBBERISH_REGEX = /^([a-z0-9])\1{4,}$|^(asdf|qwerty|zxcv|1234|test|testing)+$|asdfgh|ghjkl|qwertyuiop|[bcdfghjklmnpqrstvwxyz]{6,}/i;

// Slang and colloquial mapping dictionary
const SLANG_DICTIONARY: Record<string, string> = {
  'chori': 'theft',
  'pocket maar': 'pickpocketing',
  'chindi chori': 'petty theft',
  'lafda': 'physical altercation',
  'dhamki': 'criminal intimidation',
  'chaku': 'edged bladed weapon',
  'tamancha': 'unlicensed firearm',
  'katta': 'country-made pistol',
  'maar peet': 'physical assault',
  'laapata': 'missing person',
  'gayab': 'unaccounted / missing',
  'paisa loot': 'armed robbery / extortion',
  'vasooli': 'extortion',
  'gaadi chori': 'motor vehicle theft',
  'bike leke bhaag': 'escaped on two-wheeler',
  'snatch': 'unlawful snatching',
  'hafta': 'illicit extortion demands',
  'police chor': 'unverified defamatory statement',
};

/**
 * 1. Language Detection Engine
 * Accurately detects Indic Unicode scripts, Romanized Hinglish, and Standard English.
 */
export function detectLanguage(text: string): LanguageDetectionResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return { code: 'en', name: 'English', nativeName: 'English', confidence: 1.0 };
  }

  // Devanagari script regex: \u0900-\u097F
  const devanagariCount = (trimmed.match(/[\u0900-\u097F]/g) || []).length;
  // Telugu: \u0C00-\u0C7F
  const teluguCount = (trimmed.match(/[\u0C00-\u0C7F]/g) || []).length;
  // Kannada: \u0C80-\u0CFF
  const kannadaCount = (trimmed.match(/[\u0C80-\u0CFF]/g) || []).length;
  // Tamil: \u0B80-\u0BFF
  const tamilCount = (trimmed.match(/[\u0B80-\u0BFF]/g) || []).length;
  // Bengali: \u0980-\u09FF
  const bengaliCount = (trimmed.match(/[\u0980-\u09FF]/g) || []).length;
  // Gujarati: \u0A80-\u0AFF
  const gujaratiCount = (trimmed.match(/[\u0A80-\u0AFF]/g) || []).length;
  // Punjabi / Gurmukhi: \u0A00-\u0A7F
  const punjabiCount = (trimmed.match(/[\u0A00-\u0A7F]/g) || []).length;
  // Arabic / Urdu: \u0600-\u06FF
  const urduCount = (trimmed.match(/[\u0600-\u06FF]/g) || []).length;

  const totalChars = trimmed.replace(/\s+/g, '').length || 1;

  if (teluguCount / totalChars > 0.3) {
    return { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', confidence: 0.95 };
  }
  if (kannadaCount / totalChars > 0.3) {
    return { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', confidence: 0.95 };
  }
  if (tamilCount / totalChars > 0.3) {
    return { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', confidence: 0.95 };
  }
  if (bengaliCount / totalChars > 0.3) {
    return { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', confidence: 0.95 };
  }
  if (gujaratiCount / totalChars > 0.3) {
    return { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', confidence: 0.95 };
  }
  if (punjabiCount / totalChars > 0.3) {
    return { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', confidence: 0.95 };
  }
  if (urduCount / totalChars > 0.3) {
    return { code: 'ur', name: 'Urdu', nativeName: 'اردو', confidence: 0.95 };
  }

  if (devanagariCount / totalChars > 0.3) {
    // Check for Marathi-specific markers (आहे, झाले, केले, पोलीस)
    if (/आहे|झाले|केले|माझे|पोलीस|भांडण|रुपये/i.test(trimmed)) {
      return { code: 'mr', name: 'Marathi', nativeName: 'मराठी', confidence: 0.92 };
    }
    return { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', confidence: 0.96 };
  }

  // Check for Romanized Hinglish vs Pure English
  const lower = trimmed.toLowerCase();
  const hinglishKeywords = [
    'chori', 'bhai', 'mera', 'meri', 'ho gaya', 'bhaag', 'gaya', 'ladke', 'paisa',
    'chaku', 'dhamki', 'maar', 'peet', 'laapata', 'metro pe', 'gate pe', 'wali', 'wala',
    'kisine', 'humko', 'mujhse', 'chin', 'liya', 'chheen', 'kidhar', 'kaha'
  ];

  let hinglishMatches = 0;
  for (const kw of hinglishKeywords) {
    if (lower.includes(kw)) hinglishMatches++;
  }

  if (hinglishMatches >= 1) {
    return {
      code: 'hinglish',
      name: 'Hinglish (Romanized Hindi)',
      nativeName: 'हिन्दी / Hinglish',
      confidence: Math.min(0.75 + hinglishMatches * 0.08, 0.98),
    };
  }

  return { code: 'en', name: 'English', nativeName: 'English', confidence: 0.94 };
}

/**
 * 2. Spam, Greeting & Unwanted Message Blocker
 */
export function checkSpamAndUnwanted(text: string): SpamCheckResult {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  if (!trimmed) {
    return { isSpamOrUnwanted: false, severity: 'SAFE' };
  }

  // Check single-word or short greeting
  const isGreetingOnly = COMMON_GREETINGS.some(
    (g) => lower === g || lower === `${g} sir` || lower === `${g} police` || lower === `${g}ji`
  );

  const cleanWords = lower.replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  const isAllGreetingWords = cleanWords.length > 0 && cleanWords.length <= 4 && cleanWords.every(w => COMMON_GREETING_WORDS.has(w));

  if (isGreetingOnly || isAllGreetingWords || (trimmed.split(/\s+/).length <= 2 && /^(hi|hello|namaste|hey|yo)\b/i.test(lower))) {
    return {
      isSpamOrUnwanted: true,
      category: 'GREETING',
      severity: 'WARNING',
      message: 'Greeting detected without incident details. Please describe the specific crime, location, or time so police can register an FIR.',
    };
  }

  // Check keyboard mash / gibberish
  if (GIBBERISH_REGEX.test(trimmed.replace(/\s+/g, '')) || trimmed.length < 5) {
    return {
      isSpamOrUnwanted: true,
      category: 'GIBBERISH',
      severity: 'BLOCK',
      message: 'Unclear or test input detected. Please provide an intelligible statement of the crime.',
    };
  }

  // Check general knowledge / weather / chat queries
  if (/^(who is the|kya haal|weather today|what is the time|who are you|how to contact)/i.test(lower)) {
    return {
      isSpamOrUnwanted: true,
      category: 'IRRELEVANT',
      severity: 'WARNING',
      message: 'Non-crime query. This portal is strictly for reporting cognizable and non-cognizable criminal offenses under Bharatiya Nagarik Suraksha Sanhita (BNSS).',
    };
  }

  return { isSpamOrUnwanted: false, severity: 'SAFE' };
}

/**
 * 3. 5W Investigative Completeness Checker
 */
export function analyzeCompleteness(text: string, locationName = '', timestamp = ''): InvestigativeChecklist {
  const combined = `${text} ${locationName} ${timestamp}`.toLowerCase();

  // When check
  const hasWhen = Boolean(
    timestamp ||
    /\b(today|yesterday|morning|evening|night|afternoon|pm|am|hours|baje|subah|shaam|raat|kal|aaj|pehle|date)\b/i.test(combined) ||
    /\d{1,2}[:.]\d{2}/.test(combined)
  );

  // Where check
  const hasWhere = Boolean(
    locationName.trim().length > 3 ||
    /\b(near|gate|station|metro|market|road|chowk|street|lane|block|sector|colony|nagar|bus stand|platform|outside|inside|floor)\b/i.test(combined)
  );

  // Who check (suspect or perpetrator details)
  const hasWho = /\b(man|woman|boy|girl|suspect|perpetrator|person|two|three|men|boys|helmet|mask|wearing|shirt|tall|rider|driver|accused|ladka|ladke|aadmi|chor)\b/i.test(combined);

  // What check (asset, vehicle, weapon, harm)
  const hasWhat = /\b(mobile|phone|iphone|samsung|purse|wallet|bag|money|cash|rupees|rs|lakh|chain|necklace|bike|motorcycle|car|pulsar|knife|gun|chaku|tamancha|threat|snatch|stole|beaten|hit|scam|fraud|extortion|otp|upi)\b/i.test(combined);

  let score = 0;
  if (hasWhen) score += 25;
  if (hasWhere) score += 25;
  if (hasWho) score += 25;
  if (hasWhat) score += 25;

  const suggestions: string[] = [];
  if (!hasWhen) suggestions.push('Approximate time/hour of incident (e.g. 15:30 hours or yesterday evening)');
  if (!hasWhere) suggestions.push('Specific landmark or exit gate (e.g. Gate 3, Sector 4, near Main Market)');
  if (!hasWho) suggestions.push('Perpetrator description (e.g. 2 males on a black bike, wearing dark helmets)');
  if (!hasWhat) suggestions.push('Exact item, asset make/model, or transaction amount lost');

  return {
    hasWhen,
    hasWhere,
    hasWho,
    hasWhat,
    completenessScore: score,
    suggestions,
  };
}

/**
 * 4. Colloquial Meaning Normalizer & Formal Section 173 BNSS Drafter
 */
export function generateFormalPoliceDraft(
  rawText: string,
  crimeType = 'Theft',
  locationName = '',
  timestamp = ''
): FormalLegalCorrection {
  const lower = rawText.toLowerCase();

  // Extract identified entities
  let asset = 'unspecified personal property';
  if (/iphone|apple/i.test(lower)) asset = 'Apple iPhone cellular device';
  else if (/samsung|redmi|oneplus|realme|vivo|oppo|mobile|phone/i.test(lower)) asset = 'cellular smartphone handset';
  else if (/chain|necklace|gold/i.test(lower)) asset = 'gold chain / precious personal jewelry';
  else if (/wallet|purse|batua/i.test(lower)) asset = 'leather wallet containing currency and identification credentials';
  else if (/bike|motorcycle|pulsar|scooter|activa/i.test(lower)) asset = 'two-wheeler motor vehicle';
  else if (/upi|otp|bank|transfer|account/i.test(lower)) asset = 'unauthorized electronic funds transfer';

  let perpetrator = 'unidentified perpetrator(s)';
  if (/two boys|2 ladke|two men|2 persons|do ladke/i.test(lower)) {
    perpetrator = 'two unidentified male perpetrators operating in concert';
  } else if (/three|3/i.test(lower)) {
    perpetrator = 'three unidentified perpetrators forming an unlawful group';
  } else if (/bike|pulsar|motorcycle/i.test(lower)) {
    perpetrator = 'unidentified vehicular perpetrators operating a two-wheeler';
  }

  const loc = locationName.trim() || 'the reported municipal locus';
  const timeStr = timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'the relevant occurrence period';

  let statutorySections = ['Section 303 BNS (Theft)'];
  let classification = 'Cognizable Offense (Theft / Snatching)';

  if (/snatch|pocket maar|chheen/i.test(lower)) {
    statutorySections = ['Section 304 BNS (Snatching)', 'Section 303 BNS (Theft)'];
    classification = 'Cognizable & Non-Bailable (Snatching)';
  } else if (/chaku|tamancha|weapon|gun|knife|dhamki/i.test(lower)) {
    statutorySections = ['Section 308 BNS (Extortion)', 'Section 351 BNS (Criminal Intimidation)', 'Arms Act'];
    classification = 'Severe Cognizable Offense (Armed Threat / Extortion)';
  } else if (/cyber|upi|fraud|otp|phishing|scam/i.test(lower)) {
    statutorySections = ['Section 318 BNS (Cheating)', 'Section 66D IT Act 2000'];
    classification = 'Cyber Financial Crime';
  } else if (/maar peet|assault|beat|injury|hurt/i.test(lower)) {
    statutorySections = ['Section 115 BNS (Voluntarily Causing Hurt)', 'Section 117 BNS (Grievous Hurt)'];
    classification = 'Physical Assault Offense';
  } else if (/laapata|missing|child|kidnap/i.test(lower)) {
    statutorySections = ['Section 137 BNS (Kidnapping)', 'Section 173 BNSS Emergency Directive'];
    classification = 'Critical Missing Person / Kidnapping';
  }

  const formalAbstract = `FORMAL STATEMENT OF INFORMATION (UNDER SECTION 173 BNSS 2023):
The complainant states that on the specified occurrence timeline at approximately ${timeStr}, in the jurisdiction vicinity of ${loc}, ${perpetrator} unlawfully engaged in criminal acts resulting in the deprivation/damage of ${asset}. The perpetrator(s) utilized element of surprise/coercion and fled the scene. 

Statutory Penal Classifications Invoked: ${statutorySections.join(', ')}.
Relief Sought: Immediate registration of First Information Report (FIR), forensic evidence preservation under Section 63 BSA, and statutory dispatch of intercept units.`;

  const normalizedKeywords = Object.keys(SLANG_DICTIONARY).filter((slang) => lower.includes(slang));

  return {
    formalAbstract,
    statutorySections,
    crimeClassification: classification,
    normalizedKeywords,
  };
}

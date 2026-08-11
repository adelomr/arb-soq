import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Ad } from "./types"
import { formatDistanceToNow } from "date-fns"
import { ar } from "date-fns/locale"
import { getExpandedSearchKeywords } from "./search-taxonomy"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Recursively converts Firestore Timestamps to plain objects.
 * This is required for Next.js to pass data from Server Components to Client Components.
 */
export function serializeFirestoreData(data: any): any {
  if (data === null || data === undefined) return data;

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => serializeFirestoreData(item));
  }

  // Handle Firestore Timestamps
  if (data && typeof data === 'object' && ('seconds' in data) && ('nanoseconds' in data) && typeof data.toDate === 'function') {
    return {
      seconds: data.seconds,
      nanoseconds: data.nanoseconds
    };
  }

  // Handle regular objects
  if (typeof data === 'object' && data.constructor === Object) {
    const result: any = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = serializeFirestoreData(value);
    }
    return result;
  }

  return data;
}

export function resolveThumbnail(ad: Ad) {
  // 1. Primary: Explicit list of image URLs
  if (ad.imageUrls && ad.imageUrls.length > 0 && ad.imageUrls[0]) {
    return ad.imageUrls[0];
  }
  
  // 2. Secondary: Singular imageUrl field (often used in Android/compatibility)
  if (ad.imageUrl) return ad.imageUrl;

  const videoUrl = (ad.videoUrl || '').trim();
  if (!videoUrl) return null;

  // 3. YouTube: Get high-quality thumbnail
  if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const match = videoUrl.match(regExp);
    const youtubeId = (match && match[2].length === 11) ? match[2] : null;
    if (youtubeId) {
      // Try maxresdefault, browsers will fallback if 404
      return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
    }
  }

  // 4. Facebook: No direct public thumbnail URL, but we can return a flag 
  // to indicates we need a custom placeholder if no other image is found.
  if (videoUrl.includes('facebook.com') || videoUrl.includes('fb.watch')) {
      // If we had a specific FB thumbnail service we would use it here
      // For now, it will return null and fallback to the UI-level placeholder
  }
  
  return null;
}

/**
 * Safely parses various date formats (ISO string, Firestore Timestamp, or number)
 * into a valid Date object. Returns a fallback date if parsing fails.
 */
export function safeParseDate(dateValue: any): Date {
  if (!dateValue) return new Date();

  // Handle Firestore Timestamp { seconds, nanoseconds }
  if (typeof dateValue === 'object' && 'seconds' in dateValue) {
    return new Date(dateValue.seconds * 1000);
  }

  // Handle number (timestamp)
  if (typeof dateValue === 'number') {
    return new Date(dateValue);
  }

  // Handle Date object
  if (dateValue instanceof Date) {
    return isNaN(dateValue.getTime()) ? new Date() : dateValue;
  }

  // Handle string
  const date = new Date(dateValue);
  if (!isNaN(date.getTime())) {
    return date;
  }

  return new Date();
}

export function getTimeAgo(ad: Ad) {
  const date = safeParseDate(ad.postedAt || ad.timestamp);
  try {
      return formatDistanceToNow(date, { addSuffix: true, locale: ar });
  } catch (e) {
      return '';
  }
}

export function getYouTubeId(url: string | undefined): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export function isShortVideo(url: string | undefined): boolean {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  const ytId = getYouTubeId(url);
  
  // YouTube shorts specific checks
  if (lowerUrl.includes('/shorts/')) return true;
  
  // Other platforms
  if (lowerUrl.includes('tiktok.com') || lowerUrl.includes('reels') || lowerUrl.includes('/reel')) return true;
  
  // Direct MP4s are treated as shorts if they don't have a platform signature and user wants them in shorts feed?
  // Actually, we usually distinguish by adType or specific URL patterns.
  return false;
}

export type AdViewType = 'shorts' | 'video' | 'standard';

export function getAdViewType(ad: Ad): AdViewType {
  const adTypeRaw = (ad.adType || '').toString().toLowerCase().trim();
  const videoUrlRaw = (ad.videoUrl || '').trim();

  const isExplicitVideo =
    adTypeRaw === 'video' ||
    adTypeRaw.includes('فيديو') ||
    adTypeRaw.includes('فديو') ||
    adTypeRaw.includes('video');

  if (isShortVideo(videoUrlRaw)) return 'shorts';
  if (videoUrlRaw || isExplicitVideo) return 'video';
  return 'standard';
}

/**
 * Normalizes phone numbers (especially Saudi numbers starting with 05)
 * to the correct international format required for WhatsApp links (e.g. 9665xxxxxxxx).
 */
export function formatWhatsAppNumber(num: string): string {
  let cleaned = num.replace(/\D/g, '');
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  }
  if (cleaned.startsWith('0')) {
    const withoutZero = cleaned.substring(1);
    if (withoutZero.length === 9 && withoutZero.startsWith('5')) { // Saudi Arabia
      cleaned = `966${withoutZero}`;
    } else if (withoutZero.length === 10 && withoutZero.startsWith('1')) { // Egypt
      cleaned = `20${withoutZero}`;
    } else if (withoutZero.length === 8 && withoutZero.startsWith('5')) { // UAE
      cleaned = `971${withoutZero}`;
    } else if (withoutZero.length === 9 && (withoutZero.startsWith('77') || withoutZero.startsWith('78') || withoutZero.startsWith('79'))) { // Jordan
      cleaned = `962${withoutZero}`;
    } else {
      cleaned = `966${withoutZero}`; // Default to Saudi Arabia
    }
  } else if (cleaned.length === 9 && cleaned.startsWith('5')) { // Saudi Arabia without 0
    cleaned = `966${cleaned}`;
  } else if (cleaned.length === 8 && cleaned.startsWith('5')) { // UAE without 0
    cleaned = `971${cleaned}`;
  }
  return cleaned;
}

/**
 * Normalizes Arabic text for search matching:
 * - Strips diacritics (tashkeel & tatweel)
 * - Standardizes Alef variations (أ, إ, آ, ٱ -> ا)
 * - Standardizes Alef Maksura & Ya (ى -> ي)
 * - Standardizes Teh Marbuta & Heh (ة -> ه)
 * - Removes invisible Unicode characters
 */
export function normalizeArabicText(text: string | null | undefined): string {
  if (!text) return '';
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[\u200B-\u200D\uFEFF]/g, '');
}

/**
 * Strip common Arabic prefixes (ال, و, ف, ب, ك, ل) from a word token.
 */
export function stripArabicPrefixes(word: string): string {
  let w = word;
  if (w.startsWith('ال') && w.length > 3) w = w.substring(2);
  else if ((w.startsWith('و') || w.startsWith('ف') || w.startsWith('ب') || w.startsWith('ك') || w.startsWith('ل')) && w.length > 3) {
    w = w.substring(1);
    if (w.startsWith('ال') && w.length > 3) w = w.substring(2);
  }
  return w;
}


/**
 * Smart Arabic search query matcher:
 * Checks if query (or any of its synonyms/crafts) matches any text in candidateFields.
 */
export function matchArabicQuery(candidateFields: (string | null | undefined)[], query: string): boolean {
  const normQuery = normalizeArabicText(query);
  if (!normQuery) return false;

  const normFields = candidateFields
    .filter(Boolean)
    .map(f => normalizeArabicText(f));

  const joinedFields = normFields.join(' ');

  // Direct substring match first
  if (joinedFields.includes(normQuery)) return true;

  // Taxonomy & Synonyms expansion check (e.g. مبلط -> سيراميك, بلاط, رخام)
  const expandedSynonyms = getExpandedSearchKeywords(query);
  for (const syn of expandedSynonyms) {
    const normSyn = normalizeArabicText(syn);
    if (normSyn && normSyn.length >= 2 && joinedFields.includes(normSyn)) {
      return true;
    }
  }

  // Token-by-token matching with prefix stripping
  const queryTokens = normQuery.split(/\s+/).filter(Boolean);
  return queryTokens.every(qToken => {
    if (joinedFields.includes(qToken)) return true;

    const qStripped = stripArabicPrefixes(qToken);
    if (qStripped.length >= 2 && joinedFields.includes(qStripped)) return true;

    // Check individual words in fields against qStripped
    const fieldWords = joinedFields.split(/\s+/);
    return fieldWords.some(fWord => {
      const fStripped = stripArabicPrefixes(fWord);
      return fWord.includes(qToken) || fWord.includes(qStripped) || (fStripped.length >= 2 && fStripped.includes(qStripped));
    });
  });
}

/**
 * Market/Country filtering helper:
 * Verifies if an ad belongs to the target market/country.
 */
export function isAdInMarket(ad: Ad, targetMarketId: string | undefined): boolean {
  if (!targetMarketId || targetMarketId === 'all') return true;
  if (!ad) return false;

  const adMarket = (ad.market || '').toLowerCase().trim();
  const target = targetMarketId.toLowerCase().trim();

  // If ad is explicitly targeted to all markets
  if (adMarket === 'all' || adMarket === 'global') return true;

  // Market code aliases mapping
  const marketAliases: Record<string, string[]> = {
    sa: ['sa', 'saudi', 'saudi arabia', 'السعودية', 'المملكة العربية السعودية'],
    eg: ['eg', 'egypt', 'مصر', 'جمهورية مصر العربية'],
    ae: ['ae', 'uae', 'emirates', 'الإمارات', 'الامارات', 'الإمارات العربية المتحدة'],
    jo: ['jo', 'jordan', 'الأردن', 'الاردن'],
    kw: ['kw', 'kuwait', 'الكويت'],
    qa: ['qa', 'qatar', 'قطر'],
    bh: ['bh', 'bahrain', 'البحرين'],
    om: ['om', 'oman', 'عمان', 'عُمان'],
    iq: ['iq', 'iraq', 'العراق'],
    dz: ['dz', 'algeria', 'الجزائر'],
    ma: ['ma', 'morocco', 'المغرب'],
    tn: ['tn', 'tunisia', 'تونس'],
    ly: ['ly', 'libya', 'ليبيا'],
    sd: ['sd', 'sudan', 'السودان'],
    ye: ['ye', 'yemen', 'اليمن'],
    sy: ['sy', 'syria', 'سوريا'],
    lb: ['lb', 'lebanon', 'لبنان'],
    ps: ['ps', 'palestine', 'فلسطين'],
  };

  const targetAliases = marketAliases[target] || [target];

  // Check ad.market
  if (adMarket && targetAliases.some(alias => adMarket === alias || adMarket.includes(alias))) {
    return true;
  }

  // Check ad.country
  const adCountry = normalizeArabicText(ad.country);
  if (adCountry) {
    if (targetAliases.some(alias => normalizeArabicText(alias) === adCountry || adCountry.includes(normalizeArabicText(alias)))) {
      return true;
    }
  }

  return false;
}

export { arabicToSlug, generateEnglishSlug } from './slug';

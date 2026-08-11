import { firestore } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  limit, 
  where,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { PageData } from './types';

const PAGES_COLLECTION = 'pages';

// Fetch all pages
export async function getAllPages(): Promise<PageData[]> {
  try {
    const q = query(collection(firestore, PAGES_COLLECTION));
    const snapshot = await getDocs(q);
    const pages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PageData));
    
    // Sort pages descendingly by createdAt, handling cases where it doesn't exist
    return pages.sort((a, b) => {
      const getTimestamp = (val: any) => {
        if (!val) return 0;
        if (typeof val.toDate === 'function') return val.toDate().getTime();
        if (val.seconds) return val.seconds * 1000;
        const d = new Date(val);
        return isNaN(d.getTime()) ? 0 : d.getTime();
      };
      return getTimestamp(b.createdAt) - getTimestamp(a.createdAt);
    });
  } catch (error) {
    console.error('Error fetching pages:', error);
    return [];
  }
}

// Fetch only published pages
export async function getPublishedPages(): Promise<PageData[]> {
  try {
    const allPages = await getAllPages();
    return allPages.filter(page => page.isPublished);
  } catch (error) {
    console.error('Error fetching published pages:', error);
    return [];
  }
}

// Fetch single page by slug
export async function getPageBySlug(slug: string): Promise<PageData | null> {
  try {
    const q = query(collection(firestore, PAGES_COLLECTION), where('slug', '==', slug), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as PageData;
  } catch (error) {
    console.error('Error fetching page by slug:', error);
    return null;
  }
}

// Create new page
export async function createPage(page: Omit<PageData, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(firestore, PAGES_COLLECTION), {
      ...page,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating page:', error);
    throw error;
  }
}

// Update existing page
export async function updatePage(id: string, data: Partial<PageData>): Promise<void> {
  try {
    const docRef = doc(firestore, PAGES_COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating page:', error);
    throw error;
  }
}

// Delete page
export async function deletePage(id: string): Promise<void> {
  try {
    const docRef = doc(firestore, PAGES_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting page:', error);
    throw error;
  }
}

import { arabicToSlug } from './slug';
export { arabicToSlug };

// Clean string for slug
export function cleanSlugString(input: string): string {
  return arabicToSlug(input);
}

// Generates a URL-friendly slug from Arabic or English text
// Converts Arabic characters to their romanized/transliterated English equivalent for clean URLs (e.g. "الماسة الزرقاء" -> "al-masa-al-zarqa")
export function generatePageSlug(title: string): string {
  const slug = arabicToSlug(title);
  if (slug && slug.length >= 2) {
    return slug;
  }
  const rand = Math.random().toString(36).slice(2, 6);
  return `p-${rand}`;
}

// Generates a descriptive, SEO-friendly slug for landing pages
export function generateLandingSlug(serviceName: string, serviceArea: string): string {
  const combined = [serviceName, serviceArea].filter(Boolean).join(' ');
  const slug = arabicToSlug(combined);
  if (slug && slug.length >= 2) {
    return slug;
  }
  const rand = Math.random().toString(36).slice(2, 6);
  return `lp-${rand}`;
}

// Resolves a unique slug by appending counter if already exists
export function resolveUniqueSlug(baseSlug: string, existingSlugs: string[]): string {
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }
  let counter = 2;
  while (existingSlugs.includes(`${baseSlug}-${counter}`)) {
    counter++;
  }
  return `${baseSlug}-${counter}`;
}

// Fetch single page by legacy slug (for 301 redirects)
export async function getPageByLegacySlug(legacySlug: string): Promise<PageData | null> {
  try {
    const q = query(collection(firestore, PAGES_COLLECTION), where('legacySlug', '==', legacySlug), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as PageData;
  } catch (error) {
    console.error('Error fetching page by legacy slug:', error);
    return null;
  }
}

// Increment views for a page
export async function incrementPageViews(id: string): Promise<void> {
  try {
    const docRef = doc(firestore, PAGES_COLLECTION, id);
    await updateDoc(docRef, {
      views: increment(1)
    });
  } catch (error) {
    console.error('Error incrementing page views:', error);
  }
}

/**
 * Fetch published landing pages only (pageType === 'landing')
 * Used for the footer landing pages drawer.
 */
export async function getPublishedLandingPages(): Promise<import('./types').PageData[]> {
  try {
    const allPages = await getPublishedPages();
    return allPages.filter(page => page.pageType === 'landing');
  } catch (error) {
    console.error('Error fetching landing pages:', error);
    return [];
  }
}

/**
 * Find a published page by its shortCode (used for /l/[code] redirects).
 */
export async function getPageByShortCode(shortCode: string): Promise<import('./types').PageData | null> {
  try {
    const q = query(
      collection(firestore, PAGES_COLLECTION),
      where('shortCode', '==', shortCode.trim()),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const d = snapshot.docs[0];
    const data = { id: d.id, ...d.data() } as import('./types').PageData;
    // التحقق من حالة النشر في الذاكرة لتجنب الفهرس المركب
    return data.isPublished ? data : null;
  } catch (error) {
    console.error('Error fetching page by shortCode:', error);
    return null;
  }
}

/**
 * Validates and normalizes a shortCode:
 * - lowercase letters, numbers and hyphens only
 * - max 20 characters
 */
export function normalizeShortCode(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 20);
}

/**
 * Auto-generates a short English code from Arabic/English service name and area.
 * Example: serviceName="سباك", serviceArea="الرياض" → "sbk-ryd"
 */
export function generateShortCode(serviceName: string, serviceArea: string): string {
  // Basic Arabic word → abbreviated English map for common service/area terms
  const arabicMap: Record<string, string> = {
    سباك: 'sbk', سباكة: 'sbk', كهرباء: 'elc', كهربائي: 'elc', نجار: 'njr', نجارة: 'njr',
    دهان: 'pnt', دهانات: 'pnt', تنظيف: 'cln', نظافة: 'cln', مكيف: 'ac', تكييف: 'ac',
    شركة: 'co', خدمات: 'srv', متخصص: 'spc', محترف: 'pro', أفضل: 'bst',
    مشتل: 'nrs', حديقة: 'grd', زراعة: 'grw', أثاث: 'fnt', نقل: 'mvg',
    عفش: 'fnt', صيانة: 'mnt', تركيب: 'inst', حراسة: 'sec', أمن: 'sec',
    الرياض: 'ryd', جدة: 'jed', مكة: 'mak', المدينة: 'med', الدمام: 'dam',
    الخبر: 'khb', الطائف: 'taf', تبوك: 'tbk', القصيم: 'qsm', عسير: 'aser',
    شمال: 'n', جنوب: 's', شرق: 'e', غرب: 'w', وسط: 'ctr', مركز: 'ctr',
    حي: '', منطقة: '', مدينة: '',
    القاهرة: 'cai', الإسكندرية: 'alx', دبي: 'dxb', أبوظبي: 'auh', الكويت: 'kwt',
  };

  const translateWord = (word: string): string => {
    const lower = word.toLowerCase();
    // If already English letters, keep first 4 chars
    if (/^[a-z]+$/.test(lower)) return lower.slice(0, 4);
    // Check Arabic map
    if (arabicMap[word]) return arabicMap[word];
    // Strip ال prefix and try again
    const stripped = word.replace(/^ال/, '');
    if (arabicMap[stripped]) return arabicMap[stripped];
    // Transliterate Arabic letters to rough English
    const translit: Record<string, string> = {
      ا: 'a', ب: 'b', ت: 't', ث: 'th', ج: 'j', ح: 'h', خ: 'kh', د: 'd', ذ: 'z',
      ر: 'r', ز: 'z', س: 's', ش: 'sh', ص: 's', ض: 'd', ط: 't', ظ: 'z', ع: 'a',
      غ: 'g', ف: 'f', ق: 'q', ك: 'k', ل: 'l', م: 'm', ن: 'n', ه: 'h', و: 'w',
      ي: 'y', ة: 'a', ى: 'a', ئ: 'y', ؤ: 'w', إ: 'a', أ: 'a', آ: 'a', لا: 'la',
    };
    let result = '';
    for (const ch of Array.from(word)) {
      result += translit[ch] ?? '';
    }
    return result.slice(0, 4);
  };

  const wordsOf = (text: string) =>
    text.split(/\s+/).map(w => w.trim()).filter(w => w.length > 1);

  const serviceWords = wordsOf(serviceName);
  const areaWords = wordsOf(serviceArea);

  // Pick best 1-2 words from service and 1 from area
  const servicePart = serviceWords
    .map(translateWord)
    .filter(Boolean)
    .slice(0, 2)
    .join('');

  const areaPart = areaWords
    .map(translateWord)
    .filter(Boolean)
    .slice(0, 1)
    .join('');

  const parts = [servicePart, areaPart].filter(Boolean);
  const base = parts.join('-') || 'lp';

  return normalizeShortCode(base);
}

/**
 * Fetch published landing pages filtered by category ID (or 'all').
 */
export async function getPublishedLandingPagesByCategory(categorySlug?: string): Promise<import('./types').PageData[]> {
  try {
    const landingPages = await getPublishedLandingPages();
    if (!categorySlug || categorySlug === 'all') {
      return landingPages;
    }
    return landingPages.filter(page => page.landingCategory === categorySlug);
  } catch (error) {
    console.error('Error fetching landing pages by category:', error);
    return [];
  }
}



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

// Generates a short, URL-friendly slug from title (first 4 words, max 50 chars)
export function generatePageSlug(title: string): string {
  // Take only the first 4 words to keep URLs short and readable
  const words = title.trim().split(/\s+/).slice(0, 4).join(' ');
  return words
    .toLowerCase()
    .replace(/[^\u0600-\u06FF\w\s-]/g, '') // Support Arabic characters
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50); // Hard cap at 50 characters
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


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
  serverTimestamp 
} from 'firebase/firestore';

export interface BlogPost {
  id?: string;
  slug: string;
  title: string;
  content: string;
  author: string;
  imageUrl?: string;
  tags?: string[];
  createdAt?: any;
}

const BLOGS_COLLECTION = 'blogs';

// Fetch all published blogs, ordered by newest first
export async function getAllBlogs(): Promise<BlogPost[]> {
  try {
    const q = query(collection(firestore, BLOGS_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return [];
  }
}

// Fetch 3 recent blogs for homepage if needed
export async function getRecentBlogs(limitCount: number = 3): Promise<BlogPost[]> {
  try {
    const q = query(collection(firestore, BLOGS_COLLECTION), orderBy('createdAt', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));
  } catch (error) {
    console.error('Error fetching recent blogs:', error);
    return [];
  }
}

export async function getBlogBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const q = query(collection(firestore, BLOGS_COLLECTION), where('slug', '==', slug), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as BlogPost;
  } catch (error) {
    console.error('Error fetching blog by slug:', error);
    return null;
  }
}

export async function createBlogPost(blog: Omit<BlogPost, 'id' | 'createdAt'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(firestore, BLOGS_COLLECTION), {
      ...blog,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating blog post:', error);
    throw error;
  }
}

export async function updateBlogPost(id: string, data: Partial<BlogPost>): Promise<void> {
  try {
    const docRef = doc(firestore, BLOGS_COLLECTION, id);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error('Error updating blog post:', error);
    throw error;
  }
}

export async function deleteBlogPost(id: string): Promise<void> {
  try {
    const docRef = doc(firestore, BLOGS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting blog post:', error);
    throw error;
  }
}

// Generates a URL friendly slug from title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

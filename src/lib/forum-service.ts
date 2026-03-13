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
  increment,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { ForumCategory, ForumThread, ForumReply } from './forum-types';

const CATEGORIES_COLLECTION = 'forum_categories';
const THREADS_COLLECTION = 'forum_threads';
const REPLIES_COLLECTION = 'forum_replies';

// --- Category Functions ---

export async function getForumCategories(): Promise<ForumCategory[]> {
  const q = query(collection(firestore, CATEGORIES_COLLECTION), orderBy('order', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ForumCategory));
}

export async function createForumCategory(category: Omit<ForumCategory, 'id' | 'threadCount'>): Promise<string> {
  const docRef = await addDoc(collection(firestore, CATEGORIES_COLLECTION), {
    ...category,
    threadCount: 0,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

// --- Thread Functions ---

export async function getForumThreads(categoryId: string): Promise<ForumThread[]> {
  const q = query(
    collection(firestore, THREADS_COLLECTION), 
    where('categoryId', '==', categoryId),
    orderBy('isPinned', 'desc'),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ForumThread));
}

export async function getForumThreadById(threadId: string): Promise<ForumThread | null> {
  const docRef = doc(firestore, THREADS_COLLECTION, threadId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as ForumThread;
  }
  return null;
}

export async function createForumThread(thread: Omit<ForumThread, 'id' | 'replyCount' | 'viewCount' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const batch = writeBatch(firestore);
  
  const threadRef = doc(collection(firestore, THREADS_COLLECTION));
  const now = serverTimestamp();
  
  batch.set(threadRef, {
    ...thread,
    replyCount: 0,
    viewCount: 0,
    createdAt: now,
    updatedAt: now,
  });
  
  const categoryRef = doc(firestore, CATEGORIES_COLLECTION, thread.categoryId);
  batch.update(categoryRef, {
    threadCount: increment(1),
    lastPostAt: now,
  });
  
  await batch.commit();
  return threadRef.id;
}

// --- Reply Functions ---

export async function getForumReplies(threadId: string): Promise<ForumReply[]> {
  const q = query(
    collection(firestore, REPLIES_COLLECTION), 
    where('threadId', '==', threadId),
    orderBy('createdAt', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ForumReply));
}

export async function createForumReply(reply: Omit<ForumReply, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const batch = writeBatch(firestore);
  
  const replyRef = doc(collection(firestore, REPLIES_COLLECTION));
  const now = serverTimestamp();
  
  batch.set(replyRef, {
    ...reply,
    createdAt: now,
    updatedAt: now,
  });
  
  const threadRef = doc(firestore, THREADS_COLLECTION, reply.threadId);
  batch.update(threadRef, {
    replyCount: increment(1),
    updatedAt: now,
  });
  
  await batch.commit();
  return replyRef.id;
}

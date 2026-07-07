import { firestore } from './firebase';
import {
  collection,
  doc,
  addDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';

export interface Comment {
  id?: string;
  entityId: string;       // blog slug or ad id
  entityType: 'blog' | 'ad';
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt?: any;
}

const COMMENTS_COLLECTION = 'comments';

/**
 * Subscribe to real-time comments for a given entity (blog/ad)
 */
export function subscribeToComments(
  entityId: string,
  entityType: 'blog' | 'ad',
  callback: (comments: Comment[]) => void
): Unsubscribe {
  const q = query(
    collection(firestore, COMMENTS_COLLECTION),
    where('entityId', '==', entityId),
    where('entityType', '==', entityType)
  );

  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Comment[];

    const getTimestampMs = (val: any) => {
      if (!val) return Date.now();
      if (typeof val.toMillis === 'function') return val.toMillis();
      if (typeof val.seconds === 'number') return val.seconds * 1000;
      if (val instanceof Date) return val.getTime();
      if (typeof val === 'number') return val;
      if (typeof val === 'string') return new Date(val).getTime();
      return Date.now();
    };

    comments.sort((a, b) => getTimestampMs(a.createdAt) - getTimestampMs(b.createdAt));
    callback(comments);
  });
}

/**
 * Add a new comment
 */
export async function addComment(
  comment: Omit<Comment, 'id' | 'createdAt'>
): Promise<string> {
  const docRef = await addDoc(collection(firestore, COMMENTS_COLLECTION), {
    ...comment,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Delete a comment by id
 */
export async function deleteComment(commentId: string): Promise<void> {
  await deleteDoc(doc(firestore, COMMENTS_COLLECTION, commentId));
}

/**
 * Fetch all comments once (for SSR if needed)
 */
export async function getComments(
  entityId: string,
  entityType: 'blog' | 'ad'
): Promise<Comment[]> {
  const q = query(
    collection(firestore, COMMENTS_COLLECTION),
    where('entityId', '==', entityId),
    where('entityType', '==', entityType)
  );
  const snapshot = await getDocs(q);
  const comments = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Comment[];

  const getTimestampMs = (val: any) => {
    if (!val) return Date.now();
    if (typeof val.toMillis === 'function') return val.toMillis();
    if (typeof val.seconds === 'number') return val.seconds * 1000;
    if (val instanceof Date) return val.getTime();
    if (typeof val === 'number') return val;
    if (typeof val === 'string') return new Date(val).getTime();
    return Date.now();
  };

  comments.sort((a, b) => getTimestampMs(a.createdAt) - getTimestampMs(b.createdAt));
  return comments;
}

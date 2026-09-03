import { firestore } from './firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  where,
  serverTimestamp,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';

export interface Notification {
  id: string;
  userId: string; // The user who receives the notification
  actorId: string; // The user who triggered the action
  actorName: string;
  actorAvatar?: string;
  type: 'reply' | 'like_thread' | 'like_reply' | 'system';
  targetId: string; // e.g. threadId or replyId
  targetUrl?: string; // the link to redirect to
  message: string;
  read: boolean;
  createdAt: Timestamp;
}

const NOTIFICATIONS_COLLECTION = 'notifications';

export async function createNotification(notification: Omit<Notification, 'id' | 'read' | 'createdAt'>): Promise<string> {
  const docRef = await addDoc(collection(firestore, NOTIFICATIONS_COLLECTION), {
    ...notification,
    read: false,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getUserNotifications(userId: string): Promise<Notification[]> {
  const q = query(
    collection(firestore, NOTIFICATIONS_COLLECTION), 
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
}

export function subscribeToUserNotifications(userId: string, callback: (notifications: Notification[]) => void): () => void {
  const q = query(
    collection(firestore, NOTIFICATIONS_COLLECTION), 
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
    callback(notifications);
  }, (err) => {
    callback([]);
  });
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const docRef = doc(firestore, NOTIFICATIONS_COLLECTION, notificationId);
  await updateDoc(docRef, { read: true });
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const notifications = await getUserNotifications(userId);
  const unreadNotifications = notifications.filter(n => !n.read);
  
  // Note: For a very large number of notifications, a batch write would be better here.
  for (const notif of unreadNotifications) {
    if (notif.id) {
       await markNotificationAsRead(notif.id);
    }
  }
}

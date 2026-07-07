import { firestore } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';

export interface Subscriber {
  email: string;
  userId?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  subscribedAt: any;
}

export interface EmailSettings {
  serviceId: string;
  templateId: string;           // قالب نموذج الاتصال (Contact Form)
  newsletterTemplateId?: string; // قالب منفصل للنشرة البريدية (Newsletter)
  publicKey: string;
  adminEmail?: string;
  updatedAt?: any;
}

const SUBSCRIBERS_COLLECTION = 'subscribers';
const SETTINGS_COLLECTION = 'settings';
const EMAIL_SETTINGS_DOC = 'email';

/**
 * Subscribe a user or guest to the newsletter.
 * Using email as document ID automatically handles duplication prevention.
 */
export async function subscribeToNewsletter(
  email: string, 
  userProfile?: { uid: string; name: string; avatarUrl?: string } | null
): Promise<void> {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) throw new Error('البريد الإلكتروني مطلوب.');

    const docRef = doc(firestore, SUBSCRIBERS_COLLECTION, normalizedEmail);
    
    const subscriberData: Partial<Subscriber> = {
      email: normalizedEmail,
      userId: userProfile?.uid || null,
      displayName: userProfile?.name || null,
      avatarUrl: userProfile?.avatarUrl || null,
      subscribedAt: serverTimestamp(),
    };

    await setDoc(docRef, subscriberData, { merge: true });
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    throw error;
  }
}

/**
 * Remove a subscriber from the newsletter.
 */
export async function unsubscribeFromNewsletter(email: string): Promise<void> {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const docRef = doc(firestore, SUBSCRIBERS_COLLECTION, normalizedEmail);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error unsubscribing from newsletter:', error);
    throw error;
  }
}

/**
 * Fetch all subscribers, ordered by newest first.
 */
export async function getNewsletterSubscribers(): Promise<Subscriber[]> {
  try {
    const q = query(
      collection(firestore, SUBSCRIBERS_COLLECTION), 
      orderBy('subscribedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Subscriber);
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    // In case the collection doesn't exist yet or has no indexes
    return [];
  }
}

/**
 * Fetch EmailJS email settings from Firestore.
 */
export async function getEmailSettings(): Promise<EmailSettings | null> {
  try {
    const docRef = doc(firestore, SETTINGS_COLLECTION, EMAIL_SETTINGS_DOC);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as EmailSettings;
    }
    return null;
  } catch (error) {
    console.error('Error fetching email settings:', error);
    return null;
  }
}

/**
 * Save EmailJS email settings to Firestore.
 */
export async function saveEmailSettings(settings: EmailSettings): Promise<void> {
  try {
    const docRef = doc(firestore, SETTINGS_COLLECTION, EMAIL_SETTINGS_DOC);
    await setDoc(docRef, {
      ...settings,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error('Error saving email settings:', error);
    throw error;
  }
}
